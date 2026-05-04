import { supabase } from "@/integrations/supabase/client";

let installed = false;
const recent = new Map<string, number>();
const DEDUP_MS = 30_000;

async function logError(payload: {
  message: string;
  stack?: string | null;
  source?: string;
  severity?: "error" | "warn" | "info";
  context?: Record<string, unknown>;
}) {
  try {
    const key = (payload.message || "").slice(0, 200) + "|" + (payload.source || "");
    const now = Date.now();
    const last = recent.get(key);
    if (last && now - last < DEDUP_MS) return;
    recent.set(key, now);

    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("client_error_logs").insert({
      user_id: user?.id ?? undefined,
      url: typeof window !== "undefined" ? window.location.href : null,
      user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
      message: payload.message?.slice(0, 2000) || "(no message)",
      stack: payload.stack?.slice(0, 8000) ?? null,
      source: payload.source ?? "window",
      severity: payload.severity ?? "error",
      context: payload.context ?? null,
    });
  } catch {
    /* swallow */
  }
}

export function installErrorLogger() {
  if (installed || typeof window === "undefined") return;
  installed = true;

  window.addEventListener("error", (e) => {
    logError({
      message: e.message || String(e.error),
      stack: e.error?.stack ?? null,
      source: "window.onerror",
      context: { filename: e.filename, lineno: e.lineno, colno: e.colno },
    });
  });

  window.addEventListener("unhandledrejection", (e) => {
    const reason: any = e.reason;
    logError({
      message: reason?.message ?? String(reason),
      stack: reason?.stack ?? null,
      source: "unhandledrejection",
    });
  });
}

export const reportError = (message: string, extra?: Record<string, unknown>) =>
  logError({ message, source: "manual", context: extra });
