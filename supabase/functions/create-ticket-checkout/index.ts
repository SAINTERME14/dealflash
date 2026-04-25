import { corsHeaders } from "@supabase/supabase-js/cors";
import { createClient } from "npm:@supabase/supabase-js@2";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
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
      kind, // "flash" | "appointment"
    } = body;

    if (!listing_id || !buyer_email || !return_url || !environment || !kind) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Load listing + category to compute ticket fee
    const { data: listing, error: lerr } = await supabase
      .from("listings")
      .select("id, seller_id, price, category_id, subcategory_id")
      .eq("id", listing_id)
      .maybeSingle();
    if (lerr || !listing) {
      return new Response(JSON.stringify({ error: "Listing not found" }), {
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

    // Compute platform fee
    let feeAmount = 2.99;
    if (category) {
      if (category.ticket_fee_type === "percent") {
        feeAmount = (basePrice * Number(category.ticket_fee_value)) / 100;
        if (category.ticket_fee_max) feeAmount = Math.min(feeAmount, Number(category.ticket_fee_max));
      } else {
        feeAmount = Number(category.ticket_fee_value);
      }
    }
    feeAmount = Math.max(feeAmount, 0.5); // Stripe min 50¢
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
  } catch (e: any) {
    console.error("create-ticket-checkout error:", e);
    return new Response(JSON.stringify({ error: e.message || "Server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
