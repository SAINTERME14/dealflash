// PWA service-worker registration with iframe/preview guards.
// In Lovable preview iframes we MUST NOT register the SW (would cache stale builds).

// Bump this version when API keys rotate or when stale caches must be purged
// across all browsers (Chrome, Edge, Firefox, Safari). Any visitor whose
// browser stored an older version will have their service worker + caches
// wiped automatically on next load.
const APP_CACHE_VERSION = "2026-04-28-keys-rotated";
const VERSION_STORAGE_KEY = "__app_cache_version";

async function purgeAllCaches() {
  // Unregister every service worker
  if ("serviceWorker" in navigator) {
    try {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((r) => r.unregister()));
    } catch {
      // ignore
    }
  }
  // Delete every Cache Storage entry
  if ("caches" in window) {
    try {
      const keys = await caches.keys();
      await Promise.all(keys.map((k) => caches.delete(k)));
    } catch {
      // ignore
    }
  }
}

export function setupPWA() {
  if (typeof window === "undefined") return;

  // ---- Auto cache invalidation across browsers ----
  try {
    const stored = localStorage.getItem(VERSION_STORAGE_KEY);
    if (stored !== APP_CACHE_VERSION) {
      localStorage.setItem(VERSION_STORAGE_KEY, APP_CACHE_VERSION);
      // Only force a hard reload if there was a previous (stale) version.
      // First-time visitors don't need to reload.
      if (stored !== null) {
        purgeAllCaches().finally(() => {
          window.location.reload();
        });
        return;
      }
      // Still purge any leftover caches for first-time-this-version visitors
      purgeAllCaches();
    }
  } catch {
    // localStorage may be unavailable (private mode); continue.
  }

  const isInIframe = (() => {
    try {
      return window.self !== window.top;
    } catch {
      return true;
    }
  })();

  const host = window.location.hostname;
  const isPreviewHost =
    host.includes("id-preview--") ||
    host.includes("lovableproject.com") ||
    host === "localhost";

  if (isPreviewHost || isInIframe) {
    // Clean up any previously-registered SWs in preview/iframe contexts.
    purgeAllCaches();
    return;
  }

  // Production: register via vite-plugin-pwa virtual module (lazy import).
  import("virtual:pwa-register")
    .then(({ registerSW }) => {
      registerSW({ immediate: true });
    })
    .catch(() => {
      // Silently ignore if the virtual module isn't available (dev).
    });
}

/** Prompt the user for native browser notification permission. */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  if (Notification.permission === "default") {
    return await Notification.requestPermission();
  }
  return Notification.permission;
}

/** Show a local notification (used as in-browser push for new messages). */
export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (typeof window === "undefined" || !("Notification" in window)) return;
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      icon: "/icon-512.png",
      badge: "/icon-512.png",
      ...options,
    });
  } catch {
    // ignore
  }
}
