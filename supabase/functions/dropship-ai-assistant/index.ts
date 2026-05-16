// Assistant IA dropshipping — streaming chat via Lovable AI Gateway
// Outils intégrés : trouver produits tendances, suggérer prix/marge, générer descriptions SEO.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT = `Tu es l'assistant IA dropshipping de Boardeal. 
Tu aides les marchands à : (1) trouver les produits tendances qui marchent, (2) choisir des fournisseurs (CJ Dropshipping en priorité), (3) fixer prix/marges, (4) rédiger des fiches produits SEO en français, (5) gérer leur boutique.
Sois concis, actionnable, donne des chiffres concrets (marge %, prix conseillé). Réponds en français par défaut.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: u } = await userClient.auth.getUser();
    if (!u?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, conversationId } = await req.json();
    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "AI gateway not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Récupérer un peu de contexte (produits tendances récents)
    const service = createClient(supabaseUrl, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: trending } = await service
      .from("trending_products")
      .select("title, category, trend_score, recommended_price, currency, reasons")
      .order("trend_score", { ascending: false })
      .limit(15);

    const contextNote = trending && trending.length
      ? `\n\nContexte — top produits tendances actuels :\n${trending.map((t: any, i: number) =>
          `${i + 1}. ${t.title} [${t.category ?? "?"}] score=${t.trend_score} prix conseillé=${t.recommended_price ?? "n/a"} ${t.currency}`
        ).join("\n")}`
      : "";

    const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        stream: true,
        messages: [
          { role: "system", content: SYSTEM_PROMPT + contextNote },
          ...messages,
        ],
      }),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "Trop de requêtes, réessayez dans quelques secondes." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "Crédits IA épuisés. Ajoutez du crédit à votre workspace." }), {
        status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok || !upstream.body) {
      return new Response(JSON.stringify({ error: "AI upstream error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Persist user message
    if (conversationId) {
      const lastUser = [...messages].reverse().find((m: any) => m.role === "user");
      if (lastUser) {
        await service.from("ai_assistant_messages").insert({
          conversation_id: conversationId,
          role: "user",
          content: String(lastUser.content ?? ""),
        });
      }
    }

    return new Response(upstream.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
