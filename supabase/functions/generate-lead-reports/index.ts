import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/**
 * generate-lead-reports
 * Génère un rapport périodique de leads par commerçant et l'insère dans `lead_reports`.
 * Admin uniquement. Body: { period: "daily"|"weekly"|"monthly", merchant_user_id?: string }
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );
    const { data: claims } = await supabase.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (!claims?.claims?.sub) return json({ error: "Unauthorized" }, 401);

    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: claims.claims.sub,
      _role: "admin",
    });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body = await req.json().catch(() => ({}));
    const period = (body.period ?? "weekly") as "daily" | "weekly" | "monthly";
    const days = period === "daily" ? 1 : period === "weekly" ? 7 : 30;

    const end = new Date();
    const start = new Date(end.getTime() - days * 24 * 3600 * 1000);

    let q = admin
      .from("leads")
      .select("merchant_user_id,status,amount_cents,currency")
      .gte("scanned_at", start.toISOString())
      .lte("scanned_at", end.toISOString());
    if (body.merchant_user_id) q = q.eq("merchant_user_id", body.merchant_user_id);
    const { data: leads, error } = await q;
    if (error) return json({ error: error.message }, 500);

    const buckets = new Map<string, { leads: number; conv: number; rev: number; cur: string }>();
    for (const l of leads ?? []) {
      const k = (l as any).merchant_user_id as string;
      const b = buckets.get(k) ?? { leads: 0, conv: 0, rev: 0, cur: "CAD" };
      b.leads++;
      if ((l as any).status === "converted") {
        b.conv++;
        b.rev += Number((l as any).amount_cents ?? 0);
        b.cur = (l as any).currency ?? b.cur;
      }
      buckets.set(k, b);
    }

    const inserts = Array.from(buckets.entries()).map(([merchant_user_id, b]) => ({
      merchant_user_id,
      period,
      period_start: start.toISOString().slice(0, 10),
      period_end: end.toISOString().slice(0, 10),
      leads_count: b.leads,
      conversions_count: b.conv,
      total_revenue_cents: b.rev,
      currency: b.cur,
    }));

    if (inserts.length) {
      const { error: insErr } = await admin.from("lead_reports").insert(inserts);
      if (insErr) return json({ error: insErr.message }, 500);
    }

    return json({ ok: true, generated: inserts.length, period });
  } catch (e) {
    return json({ error: String(e) }, 500);
  }
});

function json(payload: unknown, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
