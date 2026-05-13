// Helper d'attribution QR côté client.
// Stocke le code QR scanné pendant 30 jours pour attribution lors d'un achat.

const KEY = "boardeal_qr_attribution_v1";
const TTL_MS = 30 * 24 * 3600 * 1000;

export type QrAttribution = {
  qr_code: string;
  qr_id: string;
  owner_user_id: string;
  owner_role: string;
  saved_at: number;
};

export function setQrAttribution(att: Omit<QrAttribution, "saved_at">): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...att, saved_at: Date.now() }));
  } catch {
    /* ignore */
  }
}

export function getQrAttribution(): QrAttribution | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as QrAttribution;
    if (!parsed?.qr_code || !parsed?.saved_at) return null;
    if (Date.now() - parsed.saved_at > TTL_MS) {
      localStorage.removeItem(KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearQrAttribution(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
