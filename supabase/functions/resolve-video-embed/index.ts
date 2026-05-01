import { createClient } from "npm:@supabase/supabase-js@2";

// ── CORS ─────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  "https://dealflash.ca",
  "https://www.dealflash.ca",
  "https://preview--dealflash.lovable.app",
];

function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("Origin") ?? "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Vary": "Origin",
  };
}

// ── Whitelist stricte des domaines autorisés ──────────────────────────────────
const ALLOWED_DOMAINS: Record<string, Platform> = {
  "www.youtube.com":   "youtube",
  "youtube.com":       "youtube",
  "youtu.be":          "youtube",
  "www.tiktok.com":    "tiktok",
  "tiktok.com":        "tiktok",
  "vm.tiktok.com":     "tiktok",
  "www.instagram.com": "instagram",
  "instagram.com":     "instagram",
  "www.facebook.com":  "facebook",
  "facebook.com":      "facebook",
  "fb.watch":          "facebook",
};

type Platform = "youtube" | "tiktok" | "instagram" | "facebook";

// ── Rate limiting ─────────────────────────────────────────────────────────────
const rateMap = new Map<string, { count: number; resetAt: number }>();
function checkRate(ip: string): boolean {
  const now = Date.now();
  const e = rateMap.get(ip);
  if (!e || now > e.resetAt) { rateMap.set(ip, { count: 1, resetAt: now + 60_000 }); return true; }
  if (e.count >= 30) return false;
  e.count++;
  return true;
}

// ── Validation sécurité de l'URL ──────────────────────────────────────────────
function validateUrl(raw: string): { ok: true; url: URL; platform: Platform } | { ok: false; error: string } {
  // Caractères suspects
  if (/[<>"']|javascript:/i.test(raw)) {
    return { ok: false, error: "Caractères non autorisés dans l'URL" };
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return { ok: false, error: "URL malformée" };
  }

  // HTTPS obligatoire
  if (url.protocol !== "https:") {
    return { ok: false, error: "Seules les URLs HTTPS sont acceptées" };
  }

  // Whitelist domaine
  const platform = ALLOWED_DOMAINS[url.hostname];
  if (!platform) {
    return { ok: false, error: `Domaine non autorisé : ${url.hostname}` };
  }

  // Vérification que le chemin ne contient pas de séquences suspectes
  if (/\.{2,}|%00|<|>/.test(url.pathname)) {
    return { ok: false, error: "Chemin d'URL suspect" };
  }

  return { ok: true, url, platform };
}

// ── Client Supabase service role ──────────────────────────────────────────────
function getSupabase() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );
}

// ── Durée de cache : 72 heures ────────────────────────────────────────────────
const CACHE_TTL_MS = 72 * 60 * 60 * 1000;

// ── Appels oEmbed par plateforme ──────────────────────────────────────────────
async function fetchOembed(
  urlStr: string,
  platform: Platform
): Promise<{ embed_html?: string; thumbnail_url?: string; title?: string; author_name?: string } | null> {
  const enc = encodeURIComponent;
  const metaToken = Deno.env.get("META_ACCESS_TOKEN");

  let apiUrl: string;
  switch (platform) {
    case "youtube":
      apiUrl = `https://www.youtube.com/oembed?url=${enc(urlStr)}&format=json`;
      break;
    case "tiktok":
      apiUrl = `https://www.tiktok.com/oembed?url=${enc(urlStr)}`;
      break;
    case "instagram":
      if (!metaToken) return null;
      apiUrl = `https://graph.facebook.com/v18.0/instagram_oembed?url=${enc(urlStr)}&access_token=${enc(metaToken)}`;
      break;
    case "facebook":
      if (!metaToken) return null;
      apiUrl = `https://graph.facebook.com/v18.0/oembed_video?url=${enc(urlStr)}&access_token=${enc(metaToken)}`;
      break;
  }

  const resp = await fetch(apiUrl, {
    headers: { "User-Agent": "DealFlash-oEmbed/1.0" },
    signal: AbortSignal.timeout(8_000),
  });

  if (!resp.ok) return null;

  const data = await resp.json();
  return {
    embed_html:    data.html       ?? undefined,
    thumbnail_url: data.thumbnail_url ?? undefined,
    title:         data.title      ?? undefined,
    author_name:   data.author_name ?? undefined,
  };
}

// ── Logger d'erreur ───────────────────────────────────────────────────────────
async function logError(
  supabase: ReturnType<typeof getSupabase>,
  url: string,
  platform: Platform | null,
  errorCode: string,
  errorMsg: string,
  httpStatus?: number
) {
  await supabase.from("errors_video_resolution").insert({
    url,
    platform,
    error_code: errorCode,
    error_msg: errorMsg,
    http_status: httpStatus ?? null,
  });
}

// ── Handler principal ─────────────────────────────────────────────────────────
Deno.serve(async (req) => {
  const hdrs = corsHeaders(req);

  if (req.method === "OPTIONS") return new Response("ok", { headers: hdrs });
  if (req.method !== "POST") {
    return json({ error: "Méthode non autorisée" }, 405, hdrs);
  }

  // Rate limiting
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  if (!checkRate(ip)) {
    return json({ error: "Trop de requêtes. Réessayez dans une minute." }, 429, hdrs);
  }

  // Parse body
  let body: { url?: unknown };
  try {
    body = await req.json();
  } catch {
    return json({ error: "Corps JSON invalide" }, 400, hdrs);
  }

  if (typeof body.url !== "string" || !body.url.trim()) {
    return json({ error: "Champ 'url' requis (string)" }, 400, hdrs);
  }

  // Validation sécurité
  const validation = validateUrl(body.url.trim());
  if (!validation.ok) {
    return json({ error: validation.error }, 400, hdrs);
  }
  const { url, platform } = validation;
  const urlStr = url.toString();

  const supabase = getSupabase();

  // ── Lecture du cache ──────────────────────────────────────────────────────
  const { data: cached } = await supabase
    .from("cache_video_embeds")
    .select("platform, embed_html, thumbnail_url, title, author_name, last_resolved_at")
    .eq("url", urlStr)
    .maybeSingle();

  if (cached) {
    const age = Date.now() - new Date(cached.last_resolved_at).getTime();
    if (age < CACHE_TTL_MS) {
      // Cache valide
      if (!cached.embed_html) {
        // Entrée de cache "broken"
        return json({ status: "broken" }, 200, hdrs);
      }
      return json({
        platform:      cached.platform,
        embed_html:    cached.embed_html,
        thumbnail_url: cached.thumbnail_url,
        title:         cached.title,
        author_name:   cached.author_name,
        cached:        true,
      }, 200, hdrs);
    }
  }

  // ── Appel oEmbed ──────────────────────────────────────────────────────────
  let oembed: Awaited<ReturnType<typeof fetchOembed>> = null;
  try {
    oembed = await fetchOembed(urlStr, platform);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    await logError(supabase, urlStr, platform, "FETCH_ERROR", msg);
    // Écrire "broken" en cache pour éviter de spammer l'API
    await upsertCache(supabase, urlStr, platform, null);
    return json({ status: "broken" }, 200, hdrs);
  }

  if (!oembed || !oembed.embed_html) {
    await logError(supabase, urlStr, platform, "NO_EMBED_HTML", "oEmbed ne retourne pas de HTML");
    await upsertCache(supabase, urlStr, platform, null);
    return json({ status: "broken" }, 200, hdrs);
  }

  // ── Sanitisation de l'HTML reçu ───────────────────────────────────────────
  // On accepte uniquement les iframes des domaines autorisés
  const sanitized = sanitizeEmbedHtml(oembed.embed_html, platform);
  if (!sanitized) {
    await logError(supabase, urlStr, platform, "UNSAFE_HTML", "embed_html contient des éléments non autorisés");
    await upsertCache(supabase, urlStr, platform, null);
    return json({ status: "broken" }, 200, hdrs);
  }

  // ── Écriture en cache ─────────────────────────────────────────────────────
  await upsertCache(supabase, urlStr, platform, {
    embed_html:    sanitized,
    thumbnail_url: oembed.thumbnail_url ?? null,
    title:         oembed.title         ?? null,
    author_name:   oembed.author_name   ?? null,
  });

  return json({
    platform,
    embed_html:    sanitized,
    thumbnail_url: oembed.thumbnail_url ?? null,
    title:         oembed.title         ?? null,
    author_name:   oembed.author_name   ?? null,
    cached:        false,
  }, 200, hdrs);
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}

// Domaines autorisés dans les iframes par plateforme
const IFRAME_SRC_ALLOWLIST: Record<Platform, RegExp> = {
  youtube:   /^https:\/\/(www\.youtube(-nocookie)?\.com|youtu\.be)\//,
  tiktok:    /^https:\/\/(www\.tiktok\.com|tiktok\.com)\//,
  instagram: /^https:\/\/(www\.instagram\.com|instagram\.com)\//,
  facebook:  /^https:\/\/(www\.facebook\.com|facebook\.com|fb\.watch)\//,
};

function sanitizeEmbedHtml(html: string, platform: Platform): string | null {
  // Vérifie qu'il n'y a pas de script, d'événements on*, ni de javascript:
  if (/<script/i.test(html) || /\bon\w+\s*=/i.test(html) || /javascript:/i.test(html)) {
    return null;
  }

  // Extrait le src de l'iframe et vérifie qu'il est dans la whitelist
  const srcMatch = html.match(/src=["']([^"']+)["']/i);
  if (!srcMatch) return null;

  const iframeSrc = srcMatch[1];
  if (!IFRAME_SRC_ALLOWLIST[platform].test(iframeSrc)) {
    return null;
  }

  // Ajoute loading="lazy" si absent (performance)
  let sanitized = html;
  if (!/loading=/i.test(sanitized)) {
    sanitized = sanitized.replace(/<iframe/i, '<iframe loading="lazy"');
  }

  return sanitized;
}

async function upsertCache(
  supabase: ReturnType<typeof getSupabase>,
  url: string,
  platform: Platform,
  data: {
    embed_html: string;
    thumbnail_url: string | null;
    title: string | null;
    author_name: string | null;
  } | null
) {
  await supabase.from("cache_video_embeds").upsert({
    url,
    platform,
    embed_html:        data?.embed_html    ?? null,
    thumbnail_url:     data?.thumbnail_url ?? null,
    title:             data?.title         ?? null,
    author_name:       data?.author_name   ?? null,
    last_resolved_at:  new Date().toISOString(),
  }, { onConflict: "url" });
}
