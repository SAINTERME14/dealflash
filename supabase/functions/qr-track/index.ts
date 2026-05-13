// Edge function publique: log d'une visite QR + retour de la cible.
// Pas de JWT requis (visite anonyme).
import { createClient } from "npm:@supabase/supabase-js@2";

const cors: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

function buildTargetUrl(t: { target_type: string; target_id: string | null; target_url: string | null }): string {
  if (t.target_url) return t.target_url;
  if (!t.target_id) return "/";
  switch (t.target_type) {
    case "shop": return `/boutique/${t.target_id}`;
    case "product":
    case "listing": return `/annonce/${t.target_id}`;
    case "service": return `/annonce/${t.target_id}`;
    case "campaign": return `/vedette`;
    default: return "/";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });

  try {
    const { code, fingerprint, referrer } = await req.json().catch(() => ({}));
    if (!code || typeof code !== "string") {
      return new Response(JSON.stringify({ error: "code requis" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const { data: qr, error } = await supabase
      .from("qr_codes")
      .select("id, target_type, target_id, target_url, owner_user_id, owner_role, is_active, expires_at, discount_pct")
      .eq("code", code.toUpperCase())
      .maybeSingle();

    if (error || !qr) {
      return new Response(JSON.stringify({ error: "QR introuvable" }), {
        status: 404, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!qr.is_active || (qr.expires_at && new Date(qr.expires_at) < new Date())) {
      return new Response(JSON.stringify({ error: "QR expiré" }), {
        status: 410, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? null;
    const country = req.headers.get("cf-ipcountry") ?? req.headers.get("x-vercel-ip-country") ?? null;
    const ua = req.headers.get("user-agent") ?? null;

    // Log visite (best-effort)
    await supabase.from("qr_visits").insert({
      qr_id: qr.id,
      visitor_fingerprint: fingerprint ?? ip,
      ip_country: country,
      user_agent: ua,
      referrer: referrer ?? null,
    });

    const targetUrl = buildTargetUrl(qr);

    return new Response(JSON.stringify({
      qr_id: qr.id,
      qr_code: code.toUpperCase(),
      owner_user_id: qr.owner_user_id,
      owner_role: qr.owner_role,
      target_type: qr.target_type,
      target_id: qr.target_id,
      target_url: targetUrl,
      discount_pct: qr.discount_pct,
    }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("qr-track error", e);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
