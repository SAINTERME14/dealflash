import { supabase } from "@/integrations/supabase/customClient";

/**
 * Service métier — listings.
 * Couche obligatoire entre l'UI et l'API Supabase (cf. src/services/README.md).
 */
export const listingsService = {
  async listByMarket(_marketId: string, opts: { limit?: number; offset?: number } = {}) {
    const { limit = 24, offset = 0 } = opts;
    // NOTE : ajouter `.eq("market_id", _marketId)` quand la colonne sera présente
    // sur la table `listings`. Pour l'instant on retourne le ranking global.
    const { data, error } = await supabase
      .from("ranked_listings")
      .select("*")
      .order("rank_score", { ascending: false })
      .range(offset, offset + limit - 1);
    if (error) throw error;
    return data ?? [];
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from("listings")
      .select("*")
      .eq("id", id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
