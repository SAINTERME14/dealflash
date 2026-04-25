import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type SiteContentRow = {
  id: string;
  key: string;
  value: unknown;
  description: string | null;
  category: string;
  updated_at: string;
};

/**
 * Récupère tout le contenu éditable du site.
 * Mis en cache 5 minutes — les changements admin se propagent au prochain refetch.
 */
export function useAllSiteContent() {
  return useQuery({
    queryKey: ["site_content", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("*")
        .order("category", { ascending: true })
        .order("key", { ascending: true });
      if (error) throw error;
      return (data ?? []) as SiteContentRow[];
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook pour lire un texte spécifique avec valeur de repli.
 * Usage: const title = useSiteText("hero.title", "Titre par défaut");
 */
export function useSiteText(key: string, fallback: string): string {
  const { data } = useAllSiteContent();
  const row = data?.find((r) => r.key === key);
  if (!row) return fallback;
  const v = row.value;
  if (typeof v === "string") return v;
  if (v == null) return fallback;
  return String(v);
}

/**
 * Realtime subscription : invalide le cache dès qu'un admin modifie un texte.
 * À monter une seule fois (idéalement dans MainLayout ou App).
 */
export function useSiteContentRealtime(onChange: () => void) {
  useEffect(() => {
    const channel = supabase
      .channel("site_content_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_content" },
        () => onChange()
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [onChange]);
}
