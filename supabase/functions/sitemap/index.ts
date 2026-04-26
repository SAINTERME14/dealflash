// Edge function: génère un sitemap.xml dynamique avec toutes les annonces actives.
// Public, accessible sans JWT. À configurer dans config.toml.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
const SITE = "https://www.dealflash.ca";

const STATIC_URLS: Array<{ loc: string; changefreq: string; priority: string }> = [
  { loc: `${SITE}/`, changefreq: "daily", priority: "1.0" },
  { loc: `${SITE}/recherche`, changefreq: "daily", priority: "0.9" },
  { loc: `${SITE}/vedette`, changefreq: "daily", priority: "0.9" },
  { loc: `${SITE}/a-propos`, changefreq: "monthly", priority: "0.6" },
  { loc: `${SITE}/installer`, changefreq: "monthly", priority: "0.5" },
];

function escapeXml(s: string): string {
  return s.replace(/[<>&'"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '"': "&quot;" }[c]!));
}

Deno.serve(async (req) => {
  if (req.method !== "GET") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    const [{ data: listings }, { data: categories }] = await Promise.all([
      supabase
        .from("listings")
        .select("id, slug, updated_at")
        .eq("status", "active")
        .order("updated_at", { ascending: false })
        .limit(5000),
      supabase
        .from("categories")
        .select("slug")
        .eq("is_active", true)
        .is("parent_id", null),
    ]);

    const urls: string[] = [];

    for (const u of STATIC_URLS) {
      urls.push(`<url><loc>${escapeXml(u.loc)}</loc><changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`);
    }

    for (const c of categories ?? []) {
      urls.push(`<url><loc>${escapeXml(`${SITE}/categorie/${c.slug}`)}</loc><changefreq>daily</changefreq><priority>0.7</priority></url>`);
    }

    for (const l of listings ?? []) {
      const path = `/annonce/${l.slug ?? l.id}`;
      const lastmod = l.updated_at ? new Date(l.updated_at).toISOString() : new Date().toISOString();
      urls.push(`<url><loc>${escapeXml(`${SITE}${path}`)}</loc><lastmod>${lastmod}</lastmod><changefreq>weekly</changefreq><priority>0.6</priority></url>`);
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>`;

    return new Response(xml, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (e) {
    console.error("[sitemap] error", e);
    return new Response("Internal error", { status: 500 });
  }
});
