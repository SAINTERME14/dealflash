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
  }
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
