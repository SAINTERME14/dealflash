import { useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Share2, CheckCircle2 } from "lucide-react";

// Conformité Loi 25 : aucun partage automatique.
// L'utilisateur ouvre lui-même la plateforme via window.open.
// Le clic enregistre le partage côté DealFlash UNIQUEMENT après action explicite.

interface Props {
  listingId: string;
  listingTitle: string;
  dealType: string;
  /** URL publique de l'annonce */
  listingUrl?: string;
}

const PLATFORMS = [
  { key: "tiktok",     label: "TikTok",    color: "bg-black text-white" },
  { key: "facebook",   label: "Facebook",  color: "bg-blue-600 text-white" },
  { key: "instagram",  label: "Instagram", color: "bg-gradient-to-r from-purple-500 to-pink-500 text-white" },
  { key: "whatsapp",   label: "WhatsApp",  color: "bg-green-500 text-white" },
] as const;

type Platform = typeof PLATFORMS[number]["key"];

function buildShareUrl(platform: Platform, url: string, title: string): string {
  const enc = encodeURIComponent;
  switch (platform) {
    case "facebook":  return `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`;
    case "whatsapp":  return `https://wa.me/?text=${enc(title + " " + url)}`;
    // TikTok et Instagram n'ont pas d'URL de partage direct — l'utilisateur copie le lien
    default:          return "";
  }
}

export function SocialShareButtons({ listingId, listingTitle, dealType, listingUrl }: Props) {
  const { user } = useAuth();
  const [shared, setShared] = useState<Set<Platform>>(new Set());
  const [loading, setLoading] = useState<Platform | null>(null);

  const isDiscounted = dealType !== "prix_regulier";
  const url = listingUrl ?? window.location.href;

  const handleShare = async (platform: Platform) => {
    if (loading) return;
    setLoading(platform);

    // Ouvre la plateforme (action explicite de l'utilisateur)
    const shareUrl = buildShareUrl(platform, url, listingTitle);
    if (shareUrl) {
      window.open(shareUrl, "_blank", "noopener,noreferrer,width=600,height=500");
    } else {
      // TikTok / Instagram : copier le lien dans le presse-papier
      try {
        await navigator.clipboard.writeText(`${listingTitle} — ${url}`);
        toast.success(`Lien copié ! Collez-le dans ${platform === "tiktok" ? "TikTok" : "Instagram"}.`);
      } catch {
        toast.info(`Copiez ce lien : ${url}`);
      }
    }

    // Enregistrer le partage côté DealFlash (si connecté)
    if (user) {
      const { data, error } = await (supabase.rpc as any)("register_listing_share", {
        p_listing_id: listingId,
        p_platform: platform,
      });
      const d = data as any;
      if (!error && d?.success) {
        setShared((prev) => new Set([...prev, platform]));
        if (d.points_awarded > 0) {
          toast.success(`+${d.points_awarded} point${d.points_awarded > 1 ? "s" : ""} DealFlash gagnés !`);
        }
      }
    }

    setLoading(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Share2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium">Partager</span>
        {isDiscounted && (
          <Badge variant="secondary" className="text-xs">
            +2 pts / plateforme
          </Badge>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {PLATFORMS.map(({ key, label, color }) => {
          const done = shared.has(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => handleShare(key)}
              disabled={loading === key}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-opacity ${color} ${done ? "opacity-60" : "hover:opacity-90"}`}
            >
              {done ? <CheckCircle2 className="h-3 w-3" /> : null}
              {label}
            </button>
          );
        })}
      </div>

      {!user && isDiscounted && (
        <p className="text-xs text-muted-foreground">
          Connectez-vous pour accumuler des points DealFlash en partageant.
        </p>
      )}
    </div>
  );
}
