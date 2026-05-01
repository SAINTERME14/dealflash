import { useAllSiteContent, useSiteContentRealtime } from "@/hooks/useSiteContent";
import { useQueryClient } from "@tanstack/react-query";
import { Megaphone } from "lucide-react";

export function AnnouncementMarquee() {
  const { data } = useAllSiteContent();
  const queryClient = useQueryClient();
  useSiteContentRealtime(() =>
    queryClient.invalidateQueries({ queryKey: ["site_content"] })
  );

  const enabledRow = data?.find((r) => r.key === "announcement.enabled");
  const messageRow = data?.find((r) => r.key === "announcement.message");

  const enabled =
    enabledRow?.value === true ||
    enabledRow?.value === "true" ||
    String(enabledRow?.value ?? "").toLowerCase() === "true";

  const message =
    typeof messageRow?.value === "string"
      ? messageRow.value
      : messageRow?.value
      ? String(messageRow.value)
      : "";

  if (!enabled || !message.trim()) return null;

  // Répéter le texte pour un défilement continu
  const repeated = Array.from({ length: 4 }, () => message).join("   •   ");

  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden bg-accent text-accent-foreground border-b border-accent/40"
    >
      <div className="flex items-center gap-2 py-2">
        <div className="shrink-0 pl-3">
          <Megaphone className="h-4 w-4" aria-hidden="true" />
        </div>
        <div className="flex-1 overflow-hidden">
          <div className="whitespace-nowrap animate-marquee text-sm font-medium">
            {repeated}   •   {repeated}
          </div>
        </div>
      </div>
    </div>
  );
}
