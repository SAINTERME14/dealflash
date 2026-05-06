import { useSiteContent } from "@/hooks/useSiteContent";
import { useAllSiteContent } from "@/hooks/useSiteContent";

export type HomeSectionKey =
  | "home.show_flash"
  | "home.show_boutiques"
  | "home.show_services"
  | "home.show_listings";

export function useHomeSectionVisible(key: HomeSectionKey, defaultValue = true): boolean {
  const { data } = useAllSiteContent();
  const row = data?.find((r) => r.key === key);
  if (!row) return defaultValue;
  const v = row.value;
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return v !== "false";
  return defaultValue;
}
