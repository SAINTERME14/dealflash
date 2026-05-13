import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

// ── Rate limiting ───────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 100) return false;
  entry.count++;
  return true;
}

let _supabase: SupabaseClient | null = null;
function getSupabase(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
  }
  return _supabase;
}

type StripeSession = {
  id: string;
  payment_intent?: string | null;
  metadata?: Record<string, string>;
};

async function handleCheckoutCompleted(session: StripeSession) {
  const m = session.metadata || {};
  if (!m.kind || !m.listing_id || !m.buyer_id) {
    console.error("checkout.session.completed missing metadata", m);
    return;
  }

  const supabase = getSupabase();

  // Valider que le listing existe avant d'insérer le ticket
  const { data: listing } = await supabase
    .from("listings")
    .select("id, status")
    .eq("id", m.listing_id)
    .maybeSingle();
  if (!listing) {
    console.error("Listing introuvable pour listing_id:", m.listing_id);
    return;
  }

  // expires_at = fin de la flash_sale (toute la durée de l'annonce).
  // Fallback sur validity_hours seulement si pas de flash_sale.
  let expiresAt: string;
  if (m.flash_sale_id) {
    const { data: fsMeta } = await supabase
      .from("flash_sales")
      .select("ends_at")
      .eq("id", m.flash_sale_id)
      .maybeSingle();
    expiresAt = fsMeta?.ends_at ?? new Date(Date.now() + 720 * 3600 * 1000).toISOString();
  } else {
    const validityHours = parseInt(m.validity_hours || "720", 10);
    expiresAt = new Date(Date.now() + validityHours * 3600 * 1000).toISOString();
  }
  const flashPrice = Number(m.flash_price || 0);
  const platformFee = Number(m.platform_fee || 0);

  const { data: ticket, error } = await supabase
    .from("tickets")
    .insert({
      listing_id: m.listing_id,
      flash_sale_id: m.flash_sale_id || null,
      appointment_id: m.appointment_id || null,
      buyer_id: m.buyer_id,
      seller_id: m.seller_id,
      buyer_first_name: m.buyer_first_name,
      buyer_last_name: m.buyer_last_name,
      buyer_phone: m.buyer_phone,
      buyer_email: m.buyer_email,
      flash_price: flashPrice,
      platform_fee: platformFee,
      total_paid: platformFee,
      currency: "CAD",
      status: "paid",
      expires_at: expiresAt,
      stripe_session_id: session.id,
      stripe_payment_intent: session.payment_intent || null,
    })
    .select("id, confirmation_code, qr_code")
    .single();

  if (error) {
    console.error("Failed to insert ticket", error);
    return;
  }

  if (m.flash_sale_id) {
    const { data: fs } = await supabase
      .from("flash_sales")
      .select("stock_sold")
      .eq("id", m.flash_sale_id)
      .maybeSingle();
    if (fs) {
      await supabase
        .from("flash_sales")
        .update({ stock_sold: (fs.stock_sold || 0) + 1 })
        .eq("id", m.flash_sale_id);
    }
  }

  if (m.appointment_id) {
    await supabase
      .from("appointments")
      .update({ ticket_id: ticket.id, status: "paid" })
      .eq("id", m.appointment_id);
  }

  console.log("Ticket created", ticket.id, ticket.confirmation_code);

  // ── Attribution QR : crée qr_conversions + commissions selon les règles ──
  const qrCode = m.qr_code;
  if (qrCode) {
    try {
      const { data: qr } = await supabase
        .from("qr_codes")
        .select("id, owner_user_id, owner_role")
        .eq("code", qrCode)
        .maybeSingle();
      if (qr) {
        const gross = flashPrice + platformFee;
        const { data: conv } = await supabase
          .from("qr_conversions")
          .insert({
            qr_id: qr.id,
            ticket_id: ticket.id,
            order_ref: ticket.confirmation_code,
            gross_amount: gross,
            currency: "CAD",
            commission_total: 0,
          })
          .select("id")
          .single();

        if (conv) {
          // Cherche la règle commission active pour ce rôle (closer/influencer/promoter)
          const { data: rule } = await supabase
            .from("commission_rules")
            .select("pct_platform, pct_affiliate")
            .eq("affiliate_kind", qr.owner_role)
            .eq("is_active", true)
            .maybeSingle();
          const pctAff = Number(rule?.pct_affiliate ?? 50);
          const affAmount = Math.round((platformFee * pctAff) / 100 * 100) / 100;

          if (affAmount > 0) {
            await supabase.from("commissions").insert({
              qr_conversion_id: conv.id,
              beneficiary_user_id: qr.owner_user_id,
              role: qr.owner_role,
              pct: pctAff,
              amount: affAmount,
              currency: "CAD",
              status: "pending",
            });
            await supabase
              .from("qr_conversions")
              .update({ commission_total: affAmount })
              .eq("id", conv.id);
          }
        }
      }
    } catch (qrErr) {
      console.error("QR attribution error", qrErr);
    }
  }
}

async function handleRefund(charge: { payment_intent?: string | null }) {
  const supabase = getSupabase();
  const pi = charge.payment_intent;
  if (!pi) return;
  await supabase
    .from("tickets")
    .update({ status: "refunded", updated_at: new Date().toISOString() })
    .eq("stripe_payment_intent", pi);
}

// Détermine l'environnement Stripe depuis le paramètre ?env= (sandbox ou live)
// La signature est vérifiée dans verifyWebhook avec le bon secret selon l'env
function getEnvParam(req: Request): StripeEnv | null {
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv === "sandbox" || rawEnv === "live") return rawEnv;
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) return new Response("Too Many Requests", { status: 429 });

  const env = getEnvParam(req);
  if (!env) {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const event = await verifyWebhook(req, env);

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as unknown as StripeSession);
        break;
      case "charge.refunded":
        await handleRefund(event.data.object as { payment_intent?: string | null });
        break;
      default:
        console.log("Unhandled event:", event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
