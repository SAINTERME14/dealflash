import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, verifyWebhook } from "../_shared/stripe.ts";

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

  const validityHours = parseInt(m.validity_hours || "48", 10);
  const expiresAt = new Date(Date.now() + validityHours * 3600 * 1000).toISOString();
  const flashPrice = Number(m.flash_price || 0);
  const platformFee = Number(m.platform_fee || 0);

  const supabase = getSupabase();

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

  // Increment flash sale stock_sold
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

  // Link ticket to appointment if applicable
  if (m.appointment_id) {
    await supabase
      .from("appointments")
      .update({ ticket_id: ticket.id, status: "paid" })
      .eq("id", m.appointment_id);
  }

  console.log("Ticket created", ticket.id, ticket.confirmation_code);
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

async function handleWebhook(req: Request, env: StripeEnv) {
  const event = await verifyWebhook(req, env);

  switch (event.type) {
    case "checkout.session.completed":
      await handleCheckoutCompleted(event.data.object);
      break;
    case "charge.refunded":
      await handleRefund(event.data.object);
      break;
    default:
      console.log("Unhandled event:", event.type);
  }
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405 });
  const rawEnv = new URL(req.url).searchParams.get("env");
  if (rawEnv !== "sandbox" && rawEnv !== "live") {
    return new Response(JSON.stringify({ received: true, ignored: "invalid env" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }
  try {
    await handleWebhook(req, rawEnv);
    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Webhook error:", e);
    return new Response("Webhook error", { status: 400 });
  }
});
