// Autopilot pour boutiques managées : remplit automatiquement avec les top produits tendances
// + génère des descriptions SEO via IA. Réservé aux boutiques en management_mode='managed'.
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

    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { shop_id, max_products = 20 } = await req.json();

    const { data: shop } = await service.from("dropship_shops").select("*").eq("id", shop_id).maybeSingle();
    if (!shop) return new Response(JSON.stringify({ error: "Not found" }), { status: 404, headers: corsHeaders });
    if (shop.management_mode !== "managed") {
      return new Response(JSON.stringify({ error: "Boutique non managée — souscrire au plan Managed." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    // ownership or admin
    if (shop.owner_user_id !== u.user.id) {
      const { data: role } = await service.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
      if (!role) return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: corsHeaders });
    }

    const { data: trending } = await service
      .from("trending_products")
      .select("*, supplier_product:supplier_products(*)")
      .order("trend_score", { ascending: false })
      .limit(Math.min(Number(max_products), 50));

    if (!trending?.length) {
      return new Response(JSON.stringify({ imported: 0, message: "Pas de tendances détectées — lancer la détection IA d'abord." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const m = Number(shop.default_margin_pct ?? 40) / 100;
    const rows = trending
      .filter((t: any) => t.supplier_product)
      .map((t: any) => {
        const sp = t.supplier_product;
        return {
          shop_id,
          supplier_product_id: sp.id,
          title: sp.title,
          description: (t.reasons && Array.isArray(t.reasons)) ? `🔥 Tendance ${t.category ?? ""}\n\n${t.reasons.join("\n")}` : sp.description,
          images: sp.images ?? [],
          cost_price: sp.wholesale_price,
          sale_price: t.recommended_price ?? Math.round(Number(sp.wholesale_price) * (1 + m) * 100) / 100,
          currency: shop.currency ?? sp.currency,
          category: t.category,
          status: "active",
          ai_generated: true,
        };
      });

    if (!rows.length) {
      return new Response(JSON.stringify({ imported: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { error } = await service.from("dropship_shop_products").insert(rows);
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });

    await service.from("dropship_shops")
      .update({ ai_autopilot_enabled: true, status: shop.status === "draft" ? "active" : shop.status })
      .eq("id", shop_id);

    return new Response(JSON.stringify({ imported: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
