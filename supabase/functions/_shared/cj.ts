// Helper partagé pour l'API CJ Dropshipping
// Doc: https://developers.cjdropshipping.com
// - Auth: getAccessToken (token valable 15 jours)
// - Cache du token en mémoire + persistant via une table site_content (clé "cj_token_cache")
// - Rate limit: CJ recommande ~1 req/s pour la plupart des endpoints
// - Wrapper fetch avec retry exponentiel sur 429/5xx

import { createClient, type SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";
const TOKEN_CACHE_KEY = "cj_token_cache";

interface CJTokenCache {
  accessToken: string;
  accessTokenExpiryDate: string; // ISO
  refreshToken?: string;
  refreshTokenExpiryDate?: string;
}

let memoryToken: CJTokenCache | null = null;

export function getEnv() {
  const email = Deno.env.get("CJ_EMAIL");
  const apiKey = Deno.env.get("CJ_API_KEY");
  if (!email || !apiKey) {
    throw new Error("CJ_EMAIL ou CJ_API_KEY non configurés");
  }
  return { email, apiKey };
}

function getAdminClient(): SupabaseClient {
  const url = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  return createClient(url, serviceKey);
}

async function loadCachedToken(): Promise<CJTokenCache | null> {
  if (memoryToken && new Date(memoryToken.accessTokenExpiryDate).getTime() > Date.now() + 60_000) {
    return memoryToken;
  }
  const admin = getAdminClient();
  const { data } = await admin
    .from("site_content")
    .select("value")
    .eq("key", TOKEN_CACHE_KEY)
    .maybeSingle();
  if (data?.value) {
    const cached = data.value as CJTokenCache;
    if (new Date(cached.accessTokenExpiryDate).getTime() > Date.now() + 60_000) {
      memoryToken = cached;
      return cached;
    }
  }
  return null;
}

async function saveCachedToken(token: CJTokenCache): Promise<void> {
  memoryToken = token;
  const admin = getAdminClient();
  await admin
    .from("site_content")
    .upsert(
      {
        key: TOKEN_CACHE_KEY,
        value: token as unknown as Record<string, unknown>,
        category: "integrations",
        description: "Cache du token CJ Dropshipping (auto-renouvelé)",
      },
      { onConflict: "key" }
    );
}

async function fetchNewToken(): Promise<CJTokenCache> {
  const { email, apiKey } = getEnv();
  const resp = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: apiKey }),
  });
  const json = await resp.json();
  if (!resp.ok || !json?.data?.accessToken) {
    throw new Error(`CJ auth failed: ${JSON.stringify(json)}`);
  }
  const token: CJTokenCache = {
    accessToken: json.data.accessToken,
    accessTokenExpiryDate: json.data.accessTokenExpiryDate,
    refreshToken: json.data.refreshToken,
    refreshTokenExpiryDate: json.data.refreshTokenExpiryDate,
  };
  await saveCachedToken(token);
  return token;
}

export async function getCJToken(): Promise<string> {
  const cached = await loadCachedToken();
  if (cached) return cached.accessToken;
  const fresh = await fetchNewToken();
  return fresh.accessToken;
}

export async function cjFetch<T = unknown>(
  path: string,
  options: { method?: string; body?: unknown; query?: Record<string, string | number> } = {}
): Promise<T> {
  const token = await getCJToken();
  const url = new URL(`${CJ_BASE}${path}`);
  if (options.query) {
    for (const [k, v] of Object.entries(options.query)) {
      url.searchParams.set(k, String(v));
    }
  }

  let attempt = 0;
  const maxAttempts = 4;
  let lastError: unknown = null;

  while (attempt < maxAttempts) {
    attempt++;
    const resp = await fetch(url.toString(), {
      method: options.method ?? "GET",
      headers: {
        "Content-Type": "application/json",
        "CJ-Access-Token": token,
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });

    // CJ retourne du JSON même sur erreur
    let json: { result?: boolean; code?: number; message?: string; data?: unknown } = {};
    try {
      json = await resp.json();
    } catch {
      // ignore parse errors
    }

    // Token expiré → forcer refresh
    if (resp.status === 401 || json?.code === 1600 || json?.code === 1602) {
      memoryToken = null;
      await fetchNewToken();
      continue;
    }

    // Rate limit → backoff exponentiel
    if (resp.status === 429 || json?.code === 1604) {
      const wait = Math.min(1000 * 2 ** attempt, 8000);
      await new Promise((r) => setTimeout(r, wait));
      continue;
    }

    if (!resp.ok || json?.result === false) {
      lastError = new Error(`CJ API error [${resp.status}] ${json?.message ?? resp.statusText}`);
      // Erreurs 5xx → retry, sinon throw
      if (resp.status >= 500) {
        const wait = 500 * 2 ** attempt;
        await new Promise((r) => setTimeout(r, wait));
        continue;
      }
      throw lastError;
    }

    return (json.data ?? json) as T;
  }

  throw lastError ?? new Error("CJ API: max retries exceeded");
}

// Types simplifiés des réponses CJ utiles
export interface CJProductListItem {
  pid: string;
  productSku: string;
  productName: string;
  productNameEn?: string;
  productImage?: string;
  productImageSet?: string; // séparé par ;
  sellPrice?: string;
  productWeight?: string;
  categoryName?: string;
  productUrl?: string;
  variants?: Array<{ vid: string; variantSku: string; variantSellPrice: string }>;
}

export interface CJProductListResponse {
  list: CJProductListItem[];
  total: number;
  pageNum: number;
  pageSize: number;
}

export async function listCJProducts(params: {
  pageNum?: number;
  pageSize?: number;
  categoryId?: string;
  productNameEn?: string;
}): Promise<CJProductListResponse> {
  return await cjFetch<CJProductListResponse>("/product/list", {
    query: {
      pageNum: params.pageNum ?? 1,
      pageSize: params.pageSize ?? 20,
      ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      ...(params.productNameEn ? { productNameEn: params.productNameEn } : {}),
    },
  });
}

export interface CJOrderCreatePayload {
  orderNumber: string; // notre référence interne
  shippingZip: string;
  shippingCountryCode: string;
  shippingCountry: string;
  shippingProvince: string;
  shippingCity: string;
  shippingAddress: string;
  shippingCustomerName: string;
  shippingPhone: string;
  remark?: string;
  fromCountryCode?: string;
  logisticName?: string;
  products: Array<{ vid: string; quantity: number; shippingName?: string }>;
}

export async function createCJOrder(payload: CJOrderCreatePayload): Promise<{ orderId: string; orderNum: string }> {
  return await cjFetch("/shopping/order/createOrder", {
    method: "POST",
    body: payload,
  });
}

export async function getCJOrderDetail(orderId: string): Promise<Record<string, unknown>> {
  return await cjFetch(`/shopping/order/getOrderDetail`, { query: { orderId } });
}

export async function getCJTracking(orderId: string): Promise<{
  trackNumber?: string;
  trackUrl?: string;
  status?: string;
} | null> {
  try {
    const data = await cjFetch<Record<string, unknown>>(`/logistic/trackInfo`, { query: { orderId } });
    return {
      trackNumber: typeof data?.trackNumber === "string" ? data.trackNumber : undefined,
      trackUrl: typeof data?.trackUrl === "string" ? data.trackUrl : undefined,
      status: typeof data?.status === "string" ? data.status : undefined,
    };
  } catch {
    return null;
  }
}
