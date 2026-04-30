// Edge function: review-application
// Uses Lovable AI Gateway (Gemini multimodal) to evaluate an advertiser's
// application: description quality + photos + documents.
// Returns: { decision: "accept"|"needs_more"|"reject", report, suggestions }

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const MAX_ATTEMPTS = 2;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SERVICE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return json({ error: "AI key missing" }, 500);

    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: authErr } =
      await userClient.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (authErr || !claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);
    const userId = claims.claims.sub as string;

    const { application_id, force = false } = await req.json();
    if (!application_id || typeof application_id !== "string") {
      return json({ error: "application_id required" }, 400);
    }

    const admin = createClient(SUPABASE_URL, SERVICE);

    const { data: app, error: appErr } = await admin
      .from("seller_applications")
      .select("*")
      .eq("id", application_id)
      .maybeSingle();
    if (appErr || !app) return json({ error: "Not found" }, 404);

    // Authorization: owner OR moderator/admin
    const isOwner = app.user_id === userId;
    let isStaff = false;
    if (!isOwner) {
      const { data: rolesRows } = await admin
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      isStaff = (rolesRows ?? []).some((r: { role: string }) =>
        ["admin", "moderateur", "vendeur_b2c"].includes(r.role),
      );
      if (!isStaff) return json({ error: "Forbidden" }, 403);
    }

    // Limit auto-attempts for owners; staff can re-run via force
    if (isOwner && !force && (app.ai_attempts ?? 0) >= MAX_ATTEMPTS) {
      return json(
        {
          error: "MAX_ATTEMPTS_REACHED",
          message:
            "Limite de tentatives IA atteinte. Votre dossier passe en revue manuelle.",
        },
        429,
      );
    }

    // Build signed URLs for photos/documents (private bucket)
    const sign = async (paths: string[]): Promise<string[]> => {
      if (!paths?.length) return [];
      const { data } = await admin.storage
        .from("advertiser-uploads")
        .createSignedUrls(paths, 600);
      return (data ?? []).map((d) => d.signedUrl).filter(Boolean) as string[];
    };
    const photoUrls = await sign(app.photos ?? []);
    const docUrls = await sign(app.documents ?? []);

    // Build multimodal user content
    const userContent: Array<
      { type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }
    > = [
      {
        type: "text",
        text: buildPrompt(app, photoUrls.length, docUrls.length),
      },
      ...photoUrls.map((u) => ({
        type: "image_url" as const,
        image_url: { url: u },
      })),
    ];

    const aiBody = {
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userContent },
      ],
      tools: [REVIEW_TOOL],
      tool_choice: { type: "function", function: { name: "submit_review" } },
    };

    const aiRes = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(aiBody),
      },
    );

    if (!aiRes.ok) {
      const t = await aiRes.text();
      console.error("AI error", aiRes.status, t);
      if (aiRes.status === 429) return json({ error: "rate_limited" }, 429);
      if (aiRes.status === 402) return json({ error: "payment_required" }, 402);
      return json({ error: "ai_failed" }, 502);
    }

    const ai = await aiRes.json();
    const toolCall = ai.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      return json({ error: "no_tool_call" }, 502);
    }
    const review = JSON.parse(toolCall.function.arguments);

    // Persist
    const newAttempts = (app.ai_attempts ?? 0) + 1;
    let nextStatus = app.status;
    if (isOwner) {
      if (review.decision === "accept") nextStatus = "contacted"; // pending human final approval
      else if (newAttempts >= MAX_ATTEMPTS) nextStatus = "suspended";
    }

    await admin
      .from("seller_applications")
      .update({
        ai_review: review,
        ai_attempts: newAttempts,
        ai_last_run_at: new Date().toISOString(),
        status: nextStatus,
      })
      .eq("id", application_id);

    return json({
      ok: true,
      review,
      attempts: newAttempts,
      max_attempts: MAX_ATTEMPTS,
      status: nextStatus,
    });
  } catch (e) {
    console.error(e);
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SYSTEM_PROMPT = `Tu es l'assistant qualité de DealFlash, plateforme québécoise de mise en relation acheteur/vendeur.
Tu examines les candidatures d'annonceurs (particuliers, pros occasionnels, commerces, professionnels réglementés).
Tes critères :
- Description : claire (>= 40 mots), professionnelle, sans faute majeure, mentionne ce qui est vendu/loué/offert, l'état, les garanties éventuelles.
- Photos : nettes, bien cadrées, montrent réellement l'objet/service, pas de logo concurrent, pas de contenu inapproprié.
- Documents : présents si exigés (commerces=NEQ, pros réglementés=licence). Lisibles.
- Cohérence entre profil déclaré, catégorie et description.

Rends ta décision via la fonction submit_review.
Sois bienveillant et concret en français québécois professionnel.`;

const REVIEW_TOOL = {
  type: "function" as const,
  function: {
    name: "submit_review",
    description: "Renvoie la décision et le rapport d'analyse de la candidature.",
    parameters: {
      type: "object",
      properties: {
        decision: {
          type: "string",
          enum: ["accept", "needs_more", "reject"],
          description:
            "accept = conforme. needs_more = corrections nécessaires. reject = non conforme grave.",
        },
        summary: {
          type: "string",
          description: "Résumé en 1-2 phrases.",
        },
        description_score: {
          type: "integer",
          minimum: 0,
          maximum: 10,
          description: "Note sur 10 de la qualité de la description.",
        },
        description_rewrite: {
          type: "string",
          description:
            "Réécriture professionnelle proposée (uniquement si améliorable).",
        },
        photo_issues: {
          type: "array",
          items: { type: "string" },
          description: "Problèmes détectés sur les photos.",
        },
        document_issues: {
          type: "array",
          items: { type: "string" },
          description: "Problèmes détectés sur les documents.",
        },
        missing_items: {
          type: "array",
          items: { type: "string" },
          description: "Éléments manquants à ajouter.",
        },
        action_items: {
          type: "array",
          items: { type: "string" },
          description: "Liste claire de ce que l'annonceur doit corriger.",
        },
      },
      required: ["decision", "summary", "description_score", "action_items"],
      additionalProperties: false,
    },
  },
};

function buildPrompt(
  app: Record<string, unknown>,
  nPhotos: number,
  nDocs: number,
): string {
  return `CANDIDATURE À EXAMINER

Profil annonceur : ${app.advertiser_profile ?? "non précisé"}
Type d'annonce : ${app.listing_type}
Catégorie : ${app.main_category ?? "—"}
Nom commercial : ${app.business_name ?? "—"}
NEQ : ${app.neq_number ?? "—"}
Profession : ${app.profession ?? "—"}
Licence : ${app.license_number ?? "—"}
Ville : ${app.city ?? "—"}

DESCRIPTION FOURNIE :
"""${app.message ?? ""}"""

Photos jointes : ${nPhotos}
Documents joints : ${nDocs}

Examine description + photos visibles ci-dessous, puis renvoie ton verdict via submit_review.`;
}
