import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import i18n, { SUPPORTED_LOCALES, type SupportedLocale } from "@/i18n";

/**
 * MarketContext — multi-tenant par marché.
 * Détection : localStorage > géoIP (fallback) > marché par défaut.
 * Toute requête métier doit être filtrée par market_id actif.
 */

export type Market = {
  id: string;
  country_code: string;
  name: string;
  currency: string;
  languages: string[] | null;
  status: string;
  is_default: boolean | null;
};

type MarketContextValue = {
  market: Market | null;
  markets: Market[];
  loading: boolean;
  setMarket: (id: string) => void;
};

const Ctx = createContext<MarketContextValue | undefined>(undefined);
const STORAGE_KEY = "boardeal_market_id";

export function MarketProvider({ children }: { children: ReactNode }) {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [market, setMarketState] = useState<Market | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("markets")
        .select("id,country_code,name,currency,languages,status,is_default")
        .eq("status", "active");
      if (cancelled) return;
      const list = (data ?? []) as Market[];
      setMarkets(list);

      const savedId = localStorage.getItem(STORAGE_KEY);
      const found =
        list.find((m) => m.id === savedId) ??
        list.find((m) => m.is_default) ??
        list[0] ??
        null;
      setMarketState(found);
      setLoading(false);

      // Sync i18n locale on the market's primary language if supported.
      const lang = found?.languages?.[0];
      if (lang && (SUPPORTED_LOCALES as readonly string[]).includes(lang)) {
        if (i18n.language !== lang) void i18n.changeLanguage(lang as SupportedLocale);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  function setMarket(id: string) {
    const m = markets.find((x) => x.id === id) ?? null;
    if (m) {
      setMarketState(m);
      localStorage.setItem(STORAGE_KEY, m.id);
    }
  }

  return <Ctx.Provider value={{ market, markets, loading, setMarket }}>{children}</Ctx.Provider>;
}

export function useMarket() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMarket must be used inside <MarketProvider>");
  return v;
}
