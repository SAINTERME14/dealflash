// Edge function: génère un QR code Boardeal pour un affilié/commerçant
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = [
  "https://dealflash.ca",
  "https://www.dealflash.ca",
  "https://preview--dealflash.lovable.app",
  "https://boardeal.ca",
  "https://www.boardeal.ca",
];

function corsFor(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) || origin.endsWith(".lovable.app")
    ? origin
    : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
);

const VALID_TARGETS = new Set(["shop", "product", "service", "campaign", "listing"]);

function generateCode(): string {
  // 10 chars base36, suffisant pour des centaines de millions de codes
  return crypto.randomUUID().replace(/-/g, "").slice(0, 10).toUpperCase();
}

Deno.serve(async (req) => {
  const cors = corsFor(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: cors });
  }

  try {
    const token = req.headers.get("Authorization")?.replace("Bearer ", "");
    const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const { target_type, target_id, target_url, discount_pct, expires_at } = body || {};

    if (!target_type || !VALID_TARGETS.has(target_type)) {
      return new Response(JSON.stringify({ error: "target_type invalide" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }
    if (!target_id && !target_url) {
      return new Response(JSON.stringify({ error: "target_id ou target_url requis" }), {
        status: 400, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Détermine le rôle propriétaire (premier rôle non-acheteur, sinon merchant par défaut)
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);
    const roleNames = (roles ?? []).map((r: { role: string }) => r.role);
    let ownerRole: string = "merchant";
    if (roleNames.includes("admin")) ownerRole = "merchant";
    else if (roleNames.includes("vendeur_b2c") || roleNames.includes("vendeur_c2c")) ownerRole = "merchant";
    // Affilié déclaré ? on vérifie affiliate_profiles
    const { data: aff } = await supabase
      .from("affiliate_profiles")
      .select("kind")
      .eq("user_id", user.id)
      .maybeSingle();
    if (aff?.kind) ownerRole = aff.kind;

    let code = generateCode();
    // collision check (très improbable mais sûreté)
    for (let i = 0; i < 3; i++) {
      const { data: existing } = await supabase.from("qr_codes").select("id").eq("code", code).maybeSingle();
      if (!existing) break;
      code = generateCode();
    }

    const { data: inserted, error } = await supabase
      .from("qr_codes")
      .insert({
        code,
        owner_user_id: user.id,
        owner_role: ownerRole,
        target_type,
        target_id: target_id ?? null,
        target_url: target_url ?? null,
        discount_pct: discount_pct ?? null,
        expires_at: expires_at ?? null,
      })
      .select("id, code")
      .single();

    if (error) {
      console.error("qr-create insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ id: inserted.id, code: inserted.code }), {
      status: 200, headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("qr-create error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Server error" }), {
      status: 500, headers: { ...cors, "Content-Type": "application/json" },
    });
  }
});
