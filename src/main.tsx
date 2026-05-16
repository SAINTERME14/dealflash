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
const isChunkLoadError = (msg: string) =>
  /error loading dynamically imported module|Failed to fetch dynamically imported module|Importing a module script failed/i.test(msg);

window.addEventListener("error", (e) => {
  if (e?.message && isChunkLoadError(e.message) && !sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  }
});
window.addEventListener("unhandledrejection", (e) => {
  const msg = String((e?.reason as { message?: string })?.message ?? e?.reason ?? "");
  if (isChunkLoadError(msg) && !sessionStorage.getItem(RELOAD_KEY)) {
    sessionStorage.setItem(RELOAD_KEY, "1");
    window.location.reload();
  }
});
// Clear the guard once the app successfully loads.
window.addEventListener("load", () => {
  setTimeout(() => sessionStorage.removeItem(RELOAD_KEY), 5000);
});

createRoot(document.getElementById("root")!).render(<App />);
