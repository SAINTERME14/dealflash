import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

// ── CORS sécurisé : domaines autorisés seulement ────────────────────────────
const ALLOWED_ORIGINS = [
  "https://dealflash.ca",
  "https://www.dealflash.ca",
  "https://preview--dealflash.lovable.app",
];

function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ── Rate limiting simple par IP ─────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 20;
const WINDOW_MS = 60_000;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= RATE_LIMIT) return false;
  entry.count++;
  return true;
}

// ── Client Supabase (service role) ─────────────────────────────────────────
const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Trop de requêtes. Réessayez dans une minute." }), {
      status: 429,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    // Vérification JWT
    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const {
      listing_id,
      flash_sale_id,
      appointment_id,
      buyer_first_name,
      buyer_last_name,
      buyer_phone,
      buyer_email,
      return_url,
      environment,
      kind,
      qr_code,
      qr_id,
    } = body;

    if (!listing_id || !buyer_email || !return_url || !environment || !kind) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Valider listing
    const { data: listing, error: lerr } = await supabase
      .from("listings")
      .select("id, seller_id, price, category_id, subcategory_id, status")
      .eq("id", listing_id)
      .maybeSingle();
    if (lerr || !listing || listing.status !== "active") {
      return new Response(JSON.stringify({ error: "Listing not found or inactive" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const catId = listing.subcategory_id || listing.category_id;
    const { data: category } = await supabase
      .from("categories")
      .select("ticket_fee_type, ticket_fee_value, ticket_fee_max")
      .eq("id", catId)
      .maybeSingle();

    let basePrice = Number(listing.price);
    let validityHours = 48;

    if (kind === "flash" && flash_sale_id) {
      const { data: fs } = await supabase
        .from("flash_sales")
        .select("flash_price, ticket_validity_hours")
        .eq("id", flash_sale_id)
        .eq("is_active", true)
        .maybeSingle();
      if (fs) {
        basePrice = Number(fs.flash_price);
        validityHours = fs.ticket_validity_hours || 48;
      }
    }

    let feeAmount = 2.99;
    if (category) {
      if (category.ticket_fee_type === "percent") {
        feeAmount = (basePrice * Number(category.ticket_fee_value)) / 100;
        if (category.ticket_fee_max) feeAmount = Math.min(feeAmount, Number(category.ticket_fee_max));
      } else {
        feeAmount = Number(category.ticket_fee_value);
      }
    }
    feeAmount = Math.max(feeAmount, 0.5);
    const feeInCents = Math.round(feeAmount * 100);

    const stripe = createStripeClient(environment as StripeEnv);
    const session = await stripe.checkout.sessions.create({
      line_items: [{
        price_data: {
          currency: "cad",
          product_data: { name: "Frais de réservation DealFlash" },
          unit_amount: feeInCents,
        },
        quantity: 1,
      }],
      mode: "payment",
      ui_mode: "embedded",
      return_url,
      customer_email: buyer_email,
      metadata: {
        kind,
        listing_id,
        flash_sale_id: flash_sale_id || "",
        appointment_id: appointment_id || "",
        buyer_id: user.id,
        seller_id: listing.seller_id,
        buyer_first_name,
        buyer_last_name,
        buyer_phone,
        buyer_email,
        flash_price: String(basePrice),
        platform_fee: String(feeAmount),
        validity_hours: String(validityHours),
      },
    });

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("create-ticket-checkout error:", e);
    const msg = e instanceof Error ? e.message : "Server error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
