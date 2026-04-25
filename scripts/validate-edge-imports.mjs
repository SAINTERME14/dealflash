#!/usr/bin/env node
/**
 * Validate Deno imports in Supabase Edge Functions before build.
 *
 * Catches common bundling errors:
 *  - Bare specifiers (must be prefixed with npm:, jsr:, node:, http(s):, or relative path)
 *  - Invalid npm subpaths that don't exist (e.g. "npm:@supabase/supabase-js@2/cors")
 *
 * Exits with code 1 on any violation so CI / build pipelines fail fast.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";

const FUNCTIONS_DIR = "supabase/functions";
const ROOT = process.cwd();

// Known invalid npm subpaths (package + path) that have caused deploy failures.
// Add new entries here as they are discovered.
const KNOWN_INVALID_SUBPATHS = [
  // @supabase/supabase-js does NOT export a /cors helper.
  { pkg: "@supabase/supabase-js", subpath: "cors", hint: "Define corsHeaders manually in your function — there is no /cors export." },
];

const VALID_PREFIXES = ["npm:", "jsr:", "node:", "http://", "https://", "./", "../", "/"];

/** Recursively collect *.ts files under a directory. */
function walk(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const s = statSync(full);
    if (s.isDirectory()) out.push(...walk(full));
    else if (entry.endsWith(".ts") && !entry.endsWith(".d.ts")) out.push(full);
  }
  return out;
}

/** Extract every import/from specifier from a TS source. */
function extractSpecifiers(src) {
  const re = /(?:from|import)\s*["']([^"']+)["']/g;
  const out = [];
  let m;
  while ((m = re.exec(src)) !== null) out.push(m[1]);
  return out;
}

const errors = [];

let files = [];
try {
  files = walk(FUNCTIONS_DIR);
} catch {
  console.log(`[validate-edge-imports] No ${FUNCTIONS_DIR} directory — skipping.`);
  process.exit(0);
}

for (const file of files) {
  const src = readFileSync(file, "utf8");
  const specs = extractSpecifiers(src);
  const rel = relative(ROOT, file);

  for (const spec of specs) {
    // 1) Must use a valid prefix
    if (!VALID_PREFIXES.some((p) => spec.startsWith(p))) {
      errors.push(`${rel}: bare specifier "${spec}" — Deno requires npm:, jsr:, node:, https:, or a relative path (./, ../).`);
      continue;
    }

    // 2) Check known-invalid npm subpaths
    if (spec.startsWith("npm:")) {
      const body = spec.slice(4); // e.g. "@supabase/supabase-js@2/cors"
      for (const { pkg, subpath, hint } of KNOWN_INVALID_SUBPATHS) {
        // match "<pkg>" or "<pkg>@<version>" followed by "/<subpath>"
        const escaped = pkg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`^${escaped}(@[^/]+)?/${subpath}(?:[/$]|$)`);
        if (re.test(body)) {
          errors.push(`${rel}: invalid npm subpath "${spec}". ${hint}`);
        }
      }
    }
  }
}

if (errors.length > 0) {
  console.error("\n❌ Edge function import validation failed:\n");
  for (const e of errors) console.error("  • " + e);
  console.error(`\n${errors.length} issue(s) found. Fix imports before deploying.\n`);
  process.exit(1);
}

console.log(`[validate-edge-imports] ✅ Checked ${files.length} edge function file(s) — all imports valid.`);
