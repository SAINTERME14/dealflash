import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";

export type DealType =
  | "damaged_packaging"
  | "overstock"
  | "end_of_season"
  | "clearance"
  | "promo_40plus"
  | "trending";

export const DEAL_TYPE_LABELS: Record<DealType, string> = {
  damaged_packaging: "Emballage abîmé",
  overstock: "Surstock",
  end_of_season: "Fin de saison",
  clearance: "Liquidation",
  promo_40plus: "Promo 40 %+",
  trending: "Tendance",
};

export type RankedListing = {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  currency: string | null;
  images: string[] | null;
  city: string | null;
  region: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  deal_type: DealType | null;
  is_featured: boolean;
  featured_priority: number;
  has_active_flash: boolean;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  rank_score: number;
  distance_km: number | null;
};

export type SearchParams = {
  q?: string;
  dealType?: DealType | null;
  categoryId?: string | null;
  lat?: number | null;
  lng?: number | null;
  radiusKm?: number | null;
  pageSize?: number;
};

export function useRankedListings(params: SearchParams) {
  const { q, dealType, categoryId, lat, lng, radiusKm, pageSize = 24 } = params;
  const [items, setItems] = useState<RankedListing[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const offsetRef = useRef(0);
  const reqIdRef = useRef(0);

  const fetchPage = useCallback(
    async (reset: boolean) => {
      const reqId = ++reqIdRef.current;
      setLoading(true);
      setError(null);
      const offset = reset ? 0 : offsetRef.current;
      const { data, error } = await supabase.rpc("search_ranked_listings", {
        _q: q && q.trim() ? q.trim() : null,
        _deal_type: dealType ?? null,
        _category_id: categoryId ?? null,
        _lat: lat ?? null,
        _lng: lng ?? null,
        _radius_km: radiusKm ?? null,
        _limit: pageSize,
        _offset: offset,
      });
      if (reqId !== reqIdRef.current) return; // outdated
      if (error) {
        setError(error.message);
        setLoading(false);
        return;
      }
      const rows = (data ?? []) as RankedListing[];
      setItems((prev) => (reset ? rows : [...prev, ...rows]));
      offsetRef.current = offset + rows.length;
      setHasMore(rows.length === pageSize);
      setLoading(false);
    },
    [q, dealType, categoryId, lat, lng, radiusKm, pageSize]
  );

  useEffect(() => {
    offsetRef.current = 0;
    fetchPage(true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!loading && hasMore) fetchPage(false);
  }, [fetchPage, loading, hasMore]);

  return { items, loading, hasMore, error, loadMore, reload: () => fetchPage(true) };
}
