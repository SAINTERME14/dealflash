// Import 1-clic d'un supplier_product (CJ) vers une boutique dropship (WED2C-style).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });

    const { shop_id, supplier_product_ids, margin_pct } = await req.json();
    if (!shop_id || !Array.isArray(supplier_product_ids) || supplier_product_ids.length === 0) {
      return new Response(JSON.stringify({ error: "shop_id and supplier_product_ids required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Verify ownership
    const { data: shop } = await service.from("dropship_shops").select("id, owner_user_id, default_margin_pct, currency").eq("id", shop_id).maybeSingle();
    if (!shop) return new Response(JSON.stringify({ error: "Shop not found" }), { status: 404, headers: corsHeaders });
    if (shop.owner_user_id !== u.user.id) {
      const { data: role } = await service.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      if (!role) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { data: sources } = await service.from("supplier_products").select("*").in("id", supplier_product_ids);
    if (!sources?.length) return new Response(JSON.stringify({ imported: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const m = Number(margin_pct ?? shop.default_margin_pct ?? 40) / 100;
    const rows = sources.map(s => ({
      shop_id,
      supplier_product_id: s.id,
      title: s.title,
      description: s.description,
      images: s.images ?? [],
      cost_price: s.wholesale_price,
      sale_price: Math.round(Number(s.wholesale_price) * (1 + m) * 100) / 100,
      currency: shop.currency ?? s.currency,
      status: "active",
      ai_generated: false,
    }));

    const { error } = await service.from("dropship_shop_products").insert(rows);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

    return new Response(JSON.stringify({ imported: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
