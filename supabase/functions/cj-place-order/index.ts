// Edge function : créer une commande CJ Dropshipping
// Appelée manuellement par admin OU automatiquement quand un dropship_orders.pending existe
// Body: { dropship_order_id: string }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { createCJOrder } from "../_shared/cj.ts";

// ── CORS sécurisé ───────────────────────────────────────────────────────────
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
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ── Rate limiting ───────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (entry.count >= 30) return false;
  entry.count++;
  return true;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRateLimit(ip)) {
    return new Response(JSON.stringify({ error: "Too many requests" }), {
      status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const token = authHeader.replace(/^Bearer\s+/i, "");
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const adminCheck = createClient(supabaseUrl, serviceKey);
      const { data: roleCheck } = await adminCheck
        .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      if (!roleCheck) {
        return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const body = await req.json();
    const orderId = body?.dropship_order_id;
    if (!orderId || typeof orderId !== "string") {
      return new Response(JSON.stringify({ error: "dropship_order_id requis" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: order, error: orderErr } = await admin
      .from("dropship_orders")
      .select("*, dealflash_products!inner(*, supplier_products(*))")
      .eq("id", orderId)
      .maybeSingle();

    if (orderErr || !order) {
      return new Response(JSON.stringify({ error: "Commande introuvable" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (order.status !== "pending") {
      return new Response(JSON.stringify({ error: `Commande déjà au statut "${order.status}"` }), {
        status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const ship = order.shipping_address as Record<string, string> | null;
    if (!ship?.zip || !ship?.country_code || !ship?.address || !ship?.name || !ship?.phone) {
      return new Response(JSON.stringify({
        error: "Adresse incomplète (zip, country_code, address, name, phone requis)"
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supProd = order.dealflash_products?.supplier_products;
    const cjVid = supProd?.raw_data?.variants?.[0]?.vid
      ?? supProd?.raw_data?.vid
      ?? supProd?.external_sku;

    if (!cjVid) {
      return new Response(JSON.stringify({
        error: "Identifiant CJ (vid) introuvable sur le produit fournisseur"
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    let cjResponse;
    try {
      cjResponse = await createCJOrder({
        orderNumber: order.id,
        shippingZip: ship.zip,
        shippingCountryCode: ship.country_code,
        shippingCountry: ship.country ?? ship.country_code,
        shippingProvince: ship.province ?? "",
        shippingCity: ship.city ?? "",
        shippingAddress: ship.address,
        shippingCustomerName: ship.name,
        shippingPhone: ship.phone,
        remark: order.notes ?? undefined,
        products: [{ vid: String(cjVid), quantity: order.quantity }],
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Erreur CJ inconnue";
      await admin.from("dropship_orders").update({
        notes: `${order.notes ?? ""}\n[ERR ${new Date().toISOString()}] ${msg}`.trim(),
      }).eq("id", orderId);
      return new Response(JSON.stringify({ error: msg }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("dropship_orders").update({
      status: "ordered",
      external_order_id: cjResponse.orderId ?? cjResponse.orderNum ?? null,
      ordered_at: new Date().toISOString(),
    }).eq("id", orderId);

    return new Response(JSON.stringify({
      ok: true,
      external_order_id: cjResponse.orderId ?? cjResponse.orderNum,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
