// Supabase Edge Function : synchronisation fournisseurs dropshipping
// Importe / met à jour les supplier_products depuis l'API d'un fournisseur.
// Supporte : CJ Dropshipping (scaffolding), import CSV (POST body), generic_api.
// Sécurisé : exige un JWT admin valide.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { listCJProducts, type CJProductListItem } from "../_shared/cj.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SyncBody {
  supplier_id: string;
  mode?: "csv" | "api";
  csv?: string; // contenu CSV brut (mode csv)
  page?: number; // mode api CJ : page à synchroniser (par défaut 1)
  pageSize?: number; // taille de page (max 200)
  maxPages?: number; // nb max de pages à parcourir (par défaut 5)
}

interface ParsedProduct {
  external_sku: string;
  title: string;
  description?: string;
  wholesale_price: number;
  currency?: string;
  stock_quantity?: number | null;
  images?: string[];
  source_url?: string;
  raw_data?: Record<string, unknown>;
}

function parseCsv(csv: string): ParsedProduct[] {
  const lines = csv.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const idx = (k: string) => headers.indexOf(k);
  const out: ParsedProduct[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const sku = cols[idx("sku")] ?? cols[idx("external_sku")];
    const title = cols[idx("title")] ?? cols[idx("name")];
    const price = parseFloat(cols[idx("price")] ?? cols[idx("wholesale_price")] ?? "0");
    if (!sku || !title || isNaN(price)) continue;
    out.push({
      external_sku: sku,
      title,
      wholesale_price: price,
      description: cols[idx("description")] || undefined,
      currency: cols[idx("currency")] || "CAD",
      stock_quantity: cols[idx("stock")] ? parseInt(cols[idx("stock")]) : null,
      images: cols[idx("image_url")] ? [cols[idx("image_url")]] : [],
      source_url: cols[idx("source_url")] || undefined,
    });
  }
  return out;
}

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
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Vérifier l'utilisateur admin
    const userClient = createClient(supabaseUrl, anon, {
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

    const body: SyncBody = await req.json();
    if (!body.supplier_id) {
      return new Response(JSON.stringify({ error: "supplier_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: supplier, error: supplierErr } = await admin
      .from("suppliers").select("*").eq("id", body.supplier_id).single();
    if (supplierErr || !supplier) {
      return new Response(JSON.stringify({ error: "Supplier not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let products: ParsedProduct[] = [];

    if (body.mode === "csv" && body.csv) {
      products = parseCsv(body.csv);
    } else if (supplier.type === "cj_dropshipping") {
      // Sync live via l'API CJ Dropshipping
      if (!Deno.env.get("CJ_EMAIL") || !Deno.env.get("CJ_API_KEY")) {
        return new Response(JSON.stringify({
          error: "Secrets CJ_EMAIL et CJ_API_KEY non configurés"
        }), { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const pageSize = Math.min(body.pageSize ?? 50, 200);
      const maxPages = Math.min(body.maxPages ?? 5, 20);
      const startPage = body.page ?? 1;
      const collected: CJProductListItem[] = [];
      try {
        for (let p = startPage; p < startPage + maxPages; p++) {
          const resp = await listCJProducts({ pageNum: p, pageSize });
          if (!resp?.list?.length) break;
          collected.push(...resp.list);
          if (resp.list.length < pageSize) break;
          // throttle ~1 req/s recommandé par CJ
          await new Promise((r) => setTimeout(r, 1100));
        }
      } catch (e) {
        return new Response(JSON.stringify({
          error: e instanceof Error ? e.message : "Erreur API CJ"
        }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      products = collected.map((p) => {
        const imgs = p.productImageSet
          ? p.productImageSet.split(/[;,]\s*/).filter(Boolean)
          : (p.productImage ? [p.productImage] : []);
        return {
          external_sku: p.productSku || p.pid,
          title: p.productNameEn || p.productName,
          description: p.categoryName,
          wholesale_price: p.sellPrice ? parseFloat(String(p.sellPrice).split("--")[0]) || 0 : 0,
          currency: "USD",
          stock_quantity: null,
          images: imgs,
          source_url: p.productUrl,
          raw_data: p as unknown as Record<string, unknown>,
        };
      }).filter((p) => p.external_sku && p.title);
    } else if (supplier.type === "generic_api" && supplier.api_endpoint) {
      const resp = await fetch(supplier.api_endpoint, {
        headers: supplier.api_key_secret_name
          ? { Authorization: `Bearer ${Deno.env.get(supplier.api_key_secret_name) ?? ""}` }
          : {},
      });
      if (!resp.ok) {
        return new Response(JSON.stringify({ error: `Supplier API error: ${resp.status}` }), {
          status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const json = await resp.json();
      const arr = Array.isArray(json) ? json : json.products ?? json.data ?? [];
      products = arr.map((p: Record<string, unknown>) => ({
        external_sku: String(p.sku ?? p.id ?? ""),
        title: String(p.title ?? p.name ?? ""),
        description: typeof p.description === "string" ? p.description : undefined,
        wholesale_price: Number(p.price ?? p.wholesale_price ?? 0),
        currency: typeof p.currency === "string" ? p.currency : "CAD",
        stock_quantity: typeof p.stock === "number" ? p.stock : null,
        images: Array.isArray(p.images) ? p.images as string[] : [],
        raw_data: p,
      })).filter((p: ParsedProduct) => p.external_sku && p.title);
    } else {
      return new Response(JSON.stringify({
        error: "Mode de synchronisation non supporté pour ce fournisseur"
      }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    if (products.length === 0) {
      return new Response(JSON.stringify({ ok: true, imported: 0, message: "Aucun produit à importer" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert par (supplier_id, external_sku)
    const rows = products.map((p) => ({
      supplier_id: body.supplier_id,
      external_sku: p.external_sku,
      title: p.title,
      description: p.description ?? null,
      wholesale_price: p.wholesale_price,
      currency: p.currency ?? "CAD",
      stock_quantity: p.stock_quantity ?? null,
      images: p.images ?? [],
      source_url: p.source_url ?? null,
      raw_data: p.raw_data ?? {},
      last_synced_at: new Date().toISOString(),
    }));

    const { error: upsertErr } = await admin
      .from("supplier_products")
      .upsert(rows, { onConflict: "supplier_id,external_sku" });

    if (upsertErr) {
      return new Response(JSON.stringify({ error: upsertErr.message }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, imported: rows.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
