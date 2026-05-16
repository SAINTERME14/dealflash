// Détection des produits tendances — admin only.
// Combine catalogue CJ (supplier_products) + IA pour scorer les meilleurs produits par catégorie.
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
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const userClient = createClient(supabaseUrl, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: corsHeaders });
    const { data: role } = await service.from("user_roles").select("role").eq("user_id", u.user.id).eq("role", "admin").maybeSingle();
    if (!role) return new Response(JSON.stringify({ error: "Admin only" }), { status: 403, headers: corsHeaders });

    const body = await req.json().catch(() => ({}));
    const limitPerCat = Math.min(Number(body.limit_per_category ?? 5), 10);

    // 1. Pull recent supplier_products grouped by category
    const { data: products } = await service
      .from("supplier_products")
      .select("id, title, description, wholesale_price, currency, images, raw_data")
      .order("last_synced_at", { ascending: false })
      .limit(200);

    if (!products || products.length === 0) {
      return new Response(JSON.stringify({ inserted: 0, message: "Aucun produit fournisseur — synchronisez CJ d'abord." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Ask AI to score & pick trendiest per category
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), { status: 500, headers: corsHeaders });
    }

    const prompt = `Voici une liste de produits fournisseur. Analyse-les et retourne les ${limitPerCat * 4} qui sont les plus susceptibles de bien marcher en dropshipping en 2026 (problème résolu, effet visuel, marge possible, viralité TikTok/Insta). 
Pour chacun, retourne : id, category (déduis depuis le titre/description), trend_score (0-100), recommended_price (en CAD, ~3x le prix de gros), reasons (3 bullets courts en français).
Produits:
${products.slice(0, 80).map(p => `- id=${p.id} | titre="${p.title}" | gros=${p.wholesale_price} ${p.currency} | desc=${(p.description ?? "").slice(0, 80)}`).join("\n")}`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "Tu es un expert dropshipping. Réponds via l'outil select_trending." },
          { role: "user", content: prompt },
        ],
        tools: [{
          type: "function",
          function: {
            name: "select_trending",
            description: "Retourne la liste des produits tendances scorés",
            parameters: {
              type: "object",
              properties: {
                items: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      category: { type: "string" },
                      trend_score: { type: "number" },
                      recommended_price: { type: "number" },
                      reasons: { type: "array", items: { type: "string" } },
                    },
                    required: ["id", "category", "trend_score", "reasons"],
                  },
                },
              },
              required: ["items"],
            },
          },
        }],
        tool_choice: { type: "function", function: { name: "select_trending" } },
      }),
    });

    if (aiResp.status === 429 || aiResp.status === 402) {
      return new Response(JSON.stringify({
        error: aiResp.status === 429 ? "Trop de requêtes IA" : "Crédits IA épuisés"
      }), { status: aiResp.status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      return new Response(JSON.stringify({ error: "AI error", detail: t }), { status: 500, headers: corsHeaders });
    }
    const aiJson = await aiResp.json();
    const toolCall = aiJson.choices?.[0]?.message?.tool_calls?.[0];
    const args = toolCall ? JSON.parse(toolCall.function.arguments) : { items: [] };

    const productMap = new Map(products.map(p => [p.id, p]));
    const rows = (args.items || []).map((it: any) => {
      const sp = productMap.get(it.id);
      return {
        supplier_product_id: it.id,
        title: sp?.title ?? "Produit",
        category: it.category,
        trend_score: it.trend_score,
        recommended_price: it.recommended_price ?? (sp ? Number(sp.wholesale_price) * 3 : null),
        currency: sp?.currency ?? "CAD",
        reasons: it.reasons,
        source: "ai",
        detected_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(),
      };
    });

    if (rows.length === 0) {
      return new Response(JSON.stringify({ inserted: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clear stale, insert fresh
    await service.from("trending_products").delete().lt("expires_at", new Date().toISOString());
    const { error: insErr } = await service.from("trending_products").insert(rows);
    if (insErr) {
      return new Response(JSON.stringify({ error: insErr.message }), { status: 500, headers: corsHeaders });
    }

    return new Response(JSON.stringify({ inserted: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
