// PWA service-worker registration with iframe/preview guards.
// In Lovable preview iframes we MUST NOT register the SW (would cache stale builds).

export function setupPWA() {
  if (typeof window === "undefined") return;

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
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((r) => r.unregister());
      });
    }
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
