import { createClient } from "npm:@supabase/supabase-js@2";

// ── CORS ────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://dealflash.ca",
  "https://www.dealflash.ca",
  "https://preview--dealflash.lovable.app",
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ── Supabase (service role) ──────────────────────────────────────────────────
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── HMAC-SHA256 (Web Crypto API — disponible dans Deno) ─────────────────────
async function hmacSha256(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ── Calcul du rabais groupe (rétroactif) ─────────────────────────────────────
// tiers = [{min_buyers: N, bonus_percent: X}, ...] trié croissant
function groupBonus(tiers: { min_buyers: number; bonus_percent: number }[], stockSold: number): number {
  let bonus = 0;
  for (const tier of tiers) {
    if (stockSold >= tier.min_buyers) bonus = tier.bonus_percent;
  }
  return bonus;
}

// ── Handler principal ────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const hdrs = corsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: hdrs });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: hdrs });
  }

  const supabase = getSupabase();

  // Vérification JWT
  const token = req.headers.get("Authorization")?.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) {
    return json({ error: "Non autorisé" }, 401, hdrs);
  }

  let body: { ticket_id?: string };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps JSON invalide" }, 400, hdrs);
  }

  const { ticket_id } = body;
  if (!ticket_id) return json({ error: "ticket_id requis" }, 400, hdrs);

  try {
    // ── 1. Charger le ticket (appartient à l'acheteur connecté) ─────────────
    const { data: ticket, error: ticketErr } = await supabase
      .from("tickets")
      .select(`
        id, listing_id, flash_sale_id, buyer_id, seller_id,
        buyer_first_name, buyer_last_name, buyer_email, buyer_phone,
        flash_price, platform_fee, currency, status,
        expires_at, confirmation_code, order_confirmed_at,
        final_price, hmac_signature
      `)
      .eq("id", ticket_id)
      .eq("buyer_id", user.id)
      .maybeSingle();

    if (ticketErr || !ticket) return json({ error: "Ticket introuvable" }, 404, hdrs);
    if (ticket.status !== "paid") return json({ error: "Ce ticket n'est pas éligible (statut: " + ticket.status + ")" }, 400, hdrs);

    // Vérifie que l'annonce est encore dans la fenêtre valide
    if (new Date(ticket.expires_at) < new Date()) {
      return json({ error: "Ce ticket a expiré" }, 400, hdrs);
    }

    // ── 2. Si déjà confirmé, retourner le bon existant ─────────────────────
    if (ticket.order_confirmed_at) {
      const bon = await buildBonData(supabase, ticket);
      return json({ already_confirmed: true, bon }, 200, hdrs);
    }

    // ── 3. Charger listing + flash_sale pour calcul du rabais ────────────────
    const { data: listing } = await supabase
      .from("listings")
      .select(`
        id, title, description, price, currency, city, region, address,
        seller_phone, seller_email, payment_methods, pickup_info, delivery_info,
        profiles!listings_seller_id_fkey(display_name, phone, city)
      `)
      .eq("id", ticket.listing_id)
      .maybeSingle();

    if (!listing) return json({ error: "Annonce introuvable" }, 404, hdrs);

    let baseDiscount = 0;
    let socialBonusCap = 5;
    let groupTiers: { min_buyers: number; bonus_percent: number }[] = [];
    let stockSold = 0;
    let maxCap: number | null = null;
    let regularPrice = Number(ticket.flash_price);

    if (ticket.flash_sale_id) {
      const { data: fs } = await supabase
        .from("flash_sales")
        .select(`
          regular_price, flash_price, base_discount_percent,
          social_sharing_bonus_per_platform, social_bonus_cap_percent,
          group_bonus_tiers, max_discount_cap_percent,
          stock_sold, is_active, ends_at
        `)
        .eq("id", ticket.flash_sale_id)
        .maybeSingle();

      if (fs) {
        regularPrice = Number(fs.regular_price);
        baseDiscount = Number(fs.base_discount_percent ?? 0);
        if (!baseDiscount && fs.regular_price > 0) {
          baseDiscount = ((fs.regular_price - fs.flash_price) / fs.regular_price) * 100;
        }
        socialBonusCap = Number(fs.social_bonus_cap_percent ?? 5);
        groupTiers = Array.isArray(fs.group_bonus_tiers) ? fs.group_bonus_tiers : [];
        stockSold = fs.stock_sold ?? 0;
        maxCap = fs.max_discount_cap_percent ? Number(fs.max_discount_cap_percent) : null;
      }
    }

    // ── 4. Calcul des bonus sociaux déjà acquis par cet acheteur ────────────
    const { data: shares } = await supabase
      .from("listing_shares")
      .select("platform, points_awarded")
      .eq("user_id", user.id)
      .eq("listing_id", ticket.listing_id);

    // Mapping plateforme → bonus% (2% par défaut par plateforme, plafond 5%)
    const BONUS_PER_PLATFORM = 2;
    const sharedPlatforms = shares?.length ?? 0;
    const rawSocialBonus = Math.min(sharedPlatforms * BONUS_PER_PLATFORM, socialBonusCap);

    // ── 5. Calcul bonus groupe (rétroactif) ──────────────────────────────────
    const gBonus = groupBonus(groupTiers, stockSold);

    // ── 6. Rabais final (base + social + groupe, plafonné si cap défini) ──────
    let totalDiscountPct = baseDiscount + rawSocialBonus + gBonus;
    if (maxCap !== null) totalDiscountPct = Math.min(totalDiscountPct, maxCap);
    totalDiscountPct = Math.min(totalDiscountPct, 100);

    const finalPrice = Math.max(0, regularPrice * (1 - totalDiscountPct / 100));
    const finalPriceRounded = Math.round(finalPrice * 100) / 100;

    // ── 7. Génération de la signature HMAC-SHA256 ────────────────────────────
    const hmacKey = Deno.env.get("DEALFLASH_HMAC_KEY");
    if (!hmacKey || hmacKey.length < 32) {
      console.error("DEALFLASH_HMAC_KEY missing or too short");
      return json({ error: "Configuration serveur incomplète" }, 500, hdrs);
    }
    const payload = [
      ticket.id,
      ticket.confirmation_code,
      ticket.listing_id,
      ticket.buyer_id,
      ticket.seller_id,
      String(finalPriceRounded),
      ticket.expires_at,
    ].join("|");
    const signature = await hmacSha256(hmacKey, payload);

    // QR code = URL de validation avec les 32 premiers caractères de la signature
    const qrUrl = `https://dealflash.ca/valider?t=${ticket.id}&sig=${signature.slice(0, 32)}`;

    // ── 8. Persister la confirmation dans la table tickets ───────────────────
    const now = new Date().toISOString();
    const { error: updateErr } = await supabase
      .from("tickets")
      .update({
        order_confirmed_at: now,
        final_discount_percent: totalDiscountPct,
        final_price: finalPriceRounded,
        social_bonus_percent: rawSocialBonus,
        group_bonus_percent: gBonus,
        hmac_signature: signature,
      })
      .eq("id", ticket.id);

    if (updateErr) throw updateErr;

    // ── 9. Construire le bon de commande ─────────────────────────────────────
    const sellerProfile = (listing as any).profiles;
    const bon = {
      ticket_id: ticket.id,
      confirmation_code: ticket.confirmation_code,
      confirmed_at: now,
      expires_at: ticket.expires_at,

      // Produit
      listing_id: ticket.listing_id,
      listing_title: (listing as any).title,
      listing_description: (listing as any).description,
      listing_city: (listing as any).city,
      listing_region: (listing as any).region,

      // Prix
      currency: ticket.currency,
      regular_price: regularPrice,
      base_discount_percent: baseDiscount,
      social_bonus_percent: rawSocialBonus,
      group_bonus_percent: gBonus,
      total_discount_percent: totalDiscountPct,
      final_price: finalPriceRounded,
      platform_fee: ticket.platform_fee,

      // Vendeur (coordonnées pour paiement direct)
      seller_id: ticket.seller_id,
      seller_name: sellerProfile?.display_name ?? null,
      seller_phone: (listing as any).seller_phone ?? sellerProfile?.phone ?? null,
      seller_email: (listing as any).seller_email ?? null,
      seller_city: sellerProfile?.city ?? (listing as any).city ?? null,
      seller_address: (listing as any).address ?? null,
      payment_methods: (listing as any).payment_methods ?? [],
      pickup_info: (listing as any).pickup_info ?? null,
      delivery_info: (listing as any).delivery_info ?? null,

      // Acheteur
      buyer_name: `${ticket.buyer_first_name} ${ticket.buyer_last_name}`,
      buyer_email: ticket.buyer_email,
      buyer_phone: ticket.buyer_phone,

      // QR
      qr_url: qrUrl,
      hmac_signature: signature,
    };

    return json({ bon }, 200, hdrs);
  } catch (e) {
    console.error("confirm-order error:", e);
    const msg = e instanceof Error ? e.message : "Erreur serveur";
    return json({ error: msg }, 500, hdrs);
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────────

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// Reconstruit les données du bon pour un ticket déjà confirmé
async function buildBonData(supabase: ReturnType<typeof getSupabase>, ticket: Record<string, unknown>) {
  const { data: listing } = await supabase
    .from("listings")
    .select(`
      title, description, city, region, address,
      seller_phone, seller_email, payment_methods, pickup_info, delivery_info,
      profiles!listings_seller_id_fkey(display_name, phone, city)
    `)
    .eq("id", ticket.listing_id as string)
    .maybeSingle();

  const sellerProfile = (listing as any)?.profiles;
  const hmacKey = Deno.env.get("DEALFLASH_HMAC_KEY");
  if (!hmacKey || hmacKey.length < 32) {
    throw new Error("DEALFLASH_HMAC_KEY not configured");
  }
  const payload = [
    ticket.id,
    ticket.confirmation_code,
    ticket.listing_id,
    ticket.buyer_id,
    ticket.seller_id,
    String(ticket.final_price),
    ticket.expires_at,
  ].join("|");
  const signature = await hmacSha256(hmacKey, payload);
  const qrUrl = `https://dealflash.ca/valider?t=${ticket.id}&sig=${signature.slice(0, 32)}`;

  return {
    ticket_id: ticket.id,
    confirmation_code: ticket.confirmation_code,
    confirmed_at: ticket.order_confirmed_at,
    expires_at: ticket.expires_at,
    listing_id: ticket.listing_id,
    listing_title: (listing as any)?.title ?? "",
    listing_city: (listing as any)?.city ?? "",
    listing_region: (listing as any)?.region ?? "",
    currency: ticket.currency,
    final_price: ticket.final_price,
    total_discount_percent: ticket.final_discount_percent,
    social_bonus_percent: ticket.social_bonus_percent,
    group_bonus_percent: ticket.group_bonus_percent,
    platform_fee: ticket.platform_fee,
    seller_id: ticket.seller_id,
    seller_name: sellerProfile?.display_name ?? null,
    seller_phone: (listing as any)?.seller_phone ?? sellerProfile?.phone ?? null,
    seller_email: (listing as any)?.seller_email ?? null,
    seller_city: sellerProfile?.city ?? (listing as any)?.city ?? null,
    seller_address: (listing as any)?.address ?? null,
    payment_methods: (listing as any)?.payment_methods ?? [],
    pickup_info: (listing as any)?.pickup_info ?? null,
    delivery_info: (listing as any)?.delivery_info ?? null,
    buyer_name: `${ticket.buyer_first_name} ${ticket.buyer_last_name}`,
    buyer_email: ticket.buyer_email,
    buyer_phone: ticket.buyer_phone,
    qr_url: qrUrl,
    hmac_signature: signature,
  };
}
