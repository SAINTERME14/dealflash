import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./i18n";
import { setupPWA } from "./lib/pwa";
import { installErrorLogger } from "./lib/errorLogger";

setupPWA();
installErrorLogger();

// Recover from stale chunk errors after a new deploy: a dynamic import
// references a hashed file (e.g. Messages-XXXX.js) that no longer exists.
// Reload once to pick up the fresh manifest.
const RELOAD_KEY = "__chunk_reload__";
const CHUNK_PATTERNS = [
  /error loading dynamically imported module/i,
  /Failed to fetch dynamically imported module/i,
  /Importing a module script failed/i,
  /Unable to preload CSS/i,
  /ChunkLoadError/i,
  /Loading chunk \S+ failed/i,
  /Loading CSS chunk/i,
];
const isChunkLoadError = (msg: string) => CHUNK_PATTERNS.some((re) => re.test(msg));

const extractModuleUrl = (msg: string): string | null => {
  const m = msg.match(/https?:\/\/[^\s"')]+\.(?:js|mjs|css)(?:\?[^\s"')]*)?/i);
  return m ? m[0] : null;
};

const showRecoveryScreen = (moduleName: string | null) => {
  if (document.getElementById("__chunk_recovery__")) return;
  const overlay = document.createElement("div");
  overlay.id = "__chunk_recovery__";
  overlay.setAttribute("role", "alertdialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.style.cssText = [
    "position:fixed", "inset:0", "z-index:2147483647",
    "display:flex", "align-items:center", "justify-content:center",
    "background:hsl(0 0% 100%)", "color:hsl(222 47% 11%)",
    "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif",
    "padding:24px",
  ].join(";");
  const detail = moduleName ? `Module manquant : ${moduleName}` : "";
  overlay.innerHTML = `
    <div style="max-width:420px;width:100%;text-align:center;">
      <div style="width:48px;height:48px;border-radius:9999px;background:hsl(210 40% 96%);display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;font-size:24px;">↻</div>
      <h1 style="font-size:20px;font-weight:600;margin:0 0 8px;">Mise à jour disponible</h1>
      <p style="font-size:14px;line-height:1.5;color:hsl(215 16% 47%);margin:0 0 20px;">
        Une nouvelle version de l'application est en ligne. Rechargez la page pour continuer.
      </p>
      <button id="__chunk_recovery_reload__" style="display:inline-flex;align-items:center;justify-content:center;height:40px;padding:0 20px;border-radius:8px;border:0;background:hsl(222 47% 11%);color:hsl(0 0% 100%);font-size:14px;font-weight:500;cursor:pointer;">
        Recharger
      </button>
      ${detail ? `<p style="font-size:11px;color:hsl(215 16% 60%);margin:16px 0 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;">${detail}</p>` : ""}
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById("__chunk_recovery_reload__")?.addEventListener("click", () => {
    sessionStorage.removeItem(RELOAD_KEY);
    window.location.reload();
  });
};

const handleChunkError = (rawMsg: string, source: string, extra?: Record<string, unknown>) => {
  const moduleUrl = extractModuleUrl(rawMsg);
  const looksLikeChunk = isChunkLoadError(rawMsg) || (!!moduleUrl && source === "resource-error");
  if (!looksLikeChunk) return;
  const moduleName = moduleUrl ? moduleUrl.split("/").pop()?.split("?")[0] ?? null : null;
  // eslint-disable-next-line no-console
  console.warn("[chunk-load-error]", {
    source,
    message: rawMsg.slice(0, 500),
    moduleUrl,
    moduleName,
    ...extra,
  });
  if (!sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
    return;
  }
  // Auto-reload already attempted — show recovery UI instead of a blank page.
  showRecoveryScreen(moduleName);
};

// Capture phase catches resource load failures (404 on <script>/<link>)
window.addEventListener(
  "error",
  (e) => {
    const target = e.target as HTMLElement | null;
    if (target && target !== (e.currentTarget as unknown) &&
        (target instanceof HTMLScriptElement || target instanceof HTMLLinkElement)) {
      const url =
        (target as HTMLScriptElement).src || (target as HTMLLinkElement).href || "";
      if (url) handleChunkError(url, "resource-error", { tag: target.tagName });
      return;
    }
    if (e?.message) {
      handleChunkError(e.message, "window.onerror", {
        filename: e.filename,
        lineno: e.lineno,
      });
    }
  },
  true,
);

window.addEventListener("unhandledrejection", (e) => {
  const reason = e?.reason as { message?: string; stack?: string } | string | undefined;
  const msg =
    typeof reason === "string" ? reason : String(reason?.message ?? reason ?? "");
  const stack = typeof reason === "object" && reason ? reason.stack ?? "" : "";
  handleChunkError(`${msg}\n${stack}`, "unhandledrejection");
});

// Clear the guard once the app successfully loads.
window.addEventListener("load", () => {
  setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 5000);
});

createRoot(document.getElementById("root")!).render(<App />);
