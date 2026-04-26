// Edge function admin : initialise la clé service_role dans Vault
// pour permettre les automatismes (triggers + crons) qui appellent les autres edge functions
// À exécuter UNE SEULE FOIS après déploiement, ou si la clé est rotée.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

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

    // Auth admin obligatoire
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

    // Met à jour la clé Vault avec la vraie service_role_key
    const { error: rpcError } = await admin.rpc("set_vault_service_role_key", {
      _key: serviceKey,
    });

    if (rpcError) {
      // fallback : update direct via SQL (vault.update_secret existe)
      const { error: directErr } = await admin
        .from("vault.secrets" as never)
        .update({ secret: serviceKey })
        .eq("name", "service_role_key") as { error: { message: string } | null };
      if (directErr) {
        return new Response(JSON.stringify({
          error: "Impossible d'écrire dans Vault: " + (rpcError.message || directErr.message),
          hint: "Créez la fonction RPC set_vault_service_role_key via une migration",
        }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      message: "Clé service_role enregistrée dans Vault. Les automatismes CJ sont actifs.",
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
