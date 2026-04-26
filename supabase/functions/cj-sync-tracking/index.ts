// Edge function : récupérer le tracking des commandes CJ en cours
// Peut être appelée manuellement (admin) ou par cron (auth via service role)
// Met à jour status + tracking_number + tracking_url + shipped_at/delivered_at

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getCJTracking } from "../_shared/cj.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function mapCJStatus(status?: string): "ordered" | "shipped" | "delivered" | null {
  if (!status) return null;
  const s = status.toLowerCase();
  if (s.includes("deliver")) return "delivered";
  if (s.includes("ship") || s.includes("transit") || s.includes("out for")) return "shipped";
  if (s.includes("process") || s.includes("pending") || s.includes("accept")) return "ordered";
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Auth: soit JWT admin, soit service_role (cron interne)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "");
    const isServiceCall = token === serviceKey;

    if (!isServiceCall) {
      if (!authHeader) {
        return new Response(JSON.stringify({ error: "Missing authorization" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: userData } = await userClient.auth.getUser();
      if (!userData?.user) {
        return new Response(JSON.stringify({ error: "Unauthenticated" }), {
          status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const admin = createClient(supabaseUrl, serviceKey);
      const { data: roleCheck } = await admin
        .from("user_roles").select("role").eq("user_id", userData.user.id).eq("role", "admin").maybeSingle();
      if (!roleCheck) {
        return new Response(JSON.stringify({ error: "Forbidden — admin only" }), {
          status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const admin = createClient(supabaseUrl, serviceKey);

    // Cible : commandes CJ "ordered" ou "shipped" avec external_order_id
    const { data: orders, error } = await admin
      .from("dropship_orders")
      .select("id, status, external_order_id, suppliers!inner(type)")
      .in("status", ["ordered", "shipped"])
      .not("external_order_id", "is", null)
      .eq("suppliers.type", "cj_dropshipping")
      .limit(50);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let updated = 0;
    let failed = 0;

    for (const o of orders ?? []) {
      try {
        const tracking = await getCJTracking(o.external_order_id as string);
        if (!tracking) continue;

        const newStatus = mapCJStatus(tracking.status);
        const patch: Record<string, unknown> = {};

        if (tracking.trackNumber) patch.tracking_number = tracking.trackNumber;
        if (tracking.trackUrl) patch.tracking_url = tracking.trackUrl;
        if (newStatus && newStatus !== o.status) {
          patch.status = newStatus;
          if (newStatus === "shipped") patch.shipped_at = new Date().toISOString();
          if (newStatus === "delivered") patch.delivered_at = new Date().toISOString();
        }

        if (Object.keys(patch).length > 0) {
          await admin.from("dropship_orders").update(patch).eq("id", o.id);
          updated++;
        }
        // throttle
        await new Promise((r) => setTimeout(r, 1100));
      } catch {
        failed++;
      }
    }

    return new Response(JSON.stringify({ ok: true, scanned: orders?.length ?? 0, updated, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
