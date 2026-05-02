import { useState, useCallback, useRef, useEffect } from "react";
import { Play, VideoOff, ExternalLink, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Types ─────────────────────────────────────────────────────────────────────

export type VideoPlatform = "youtube" | "tiktok" | "instagram" | "facebook";

export interface VideoPlayerProps {
  url: string;
  embedHtml?: string | null;
  thumbnailUrl?: string | null;
  platform: VideoPlatform;
  status: string;
  className?: string;
}

// ── Constantes ────────────────────────────────────────────────────────────────

const PLATFORM_NAMES: Record<VideoPlatform, string> = {
  youtube:   "YouTube",
  tiktok:    "TikTok",
  instagram: "Instagram",
  facebook:  "Facebook",
};

// Clé utilisée pour stocker les consentements par catégorie
const CONSENT_KEY = "dealflash_consent";
const VIDEO_CATEGORY = "video_third_party";

// Cache de session (réinitialisé à chaque rechargement de page)
const sessionConsented = new Set<string>();

// ── Utilitaires de consentement ───────────────────────────────────────────────

function hasConsent(category: string): boolean {
  if (sessionConsented.has(category)) return true;
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return false;
    return JSON.parse(raw)[category] === true;
  } catch {
    return false;
  }
}

function saveConsent(category: string): void {
  sessionConsented.add(category);
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    const stored = raw ? JSON.parse(raw) : {};
    stored[category] = true;
    localStorage.setItem(CONSENT_KEY, JSON.stringify(stored));
  } catch {
    // ignore
  }
}

// ── Chargement des SDKs tiers ─────────────────────────────────────────────────

const loadedScripts = new Set<string>();

function loadScript(src: string): Promise<void> {
  if (loadedScripts.has(src)) return Promise.resolve();
  return new Promise((resolve) => {
    const el = document.createElement("script");
    el.src = src;
    el.async = true;
    el.onload = () => { loadedScripts.add(src); resolve(); };
    el.onerror = () => resolve();
    document.body.appendChild(el);
  });
}

async function loadSdk(platform: VideoPlatform): Promise<void> {
  switch (platform) {
    case "tiktok":
      await loadScript("https://www.tiktok.com/embed.js");
      break;
    case "instagram":
      await loadScript("https://www.instagram.com/embed.js");
      setTimeout(() => {
        (window as Window & { instgrm?: { Embeds: { process(): void } } })
          .instgrm?.Embeds.process();
      }, 150);
      break;
    case "facebook":
      await loadScript(
        "https://connect.facebook.net/fr_FR/sdk.js#xfbml=1&version=v18.0"
      );
      break;
    case "youtube":
      // iframe suffisante, pas de SDK requis
      break;
  }
}

// ── Rapport d'aspect ──────────────────────────────────────────────────────────

const ASPECT: Record<VideoPlatform, string> = {
  tiktok:    "9/16",
  instagram: "9/16",
  youtube:   "16/9",
  facebook:  "16/9",
};

// ── Composant VideoPlayer ─────────────────────────────────────────────────────

export function VideoPlayer({
  url,
  embedHtml,
  thumbnailUrl,
  platform,
  status,
  className = "",
}: VideoPlayerProps) {
  // Tous les hooks sont déclarés en premier — avant tout return conditionnel
  const [playing, setPlaying]               = useState(false);
  const [showModal, setShowModal]           = useState(false);
  const playBtnRef                          = useRef<HTMLButtonElement>(null);
  const platformName                        = PLATFORM_NAMES[platform];
  const isBroken                            = status === "broken" || status === "removed";

  const activatePlayer = useCallback(async () => {
    setPlaying(true);
    await loadSdk(platform);
  }, [platform]);

  const handlePlayClick = useCallback(() => {
    if (hasConsent(VIDEO_CATEGORY)) {
      activatePlayer();
    } else {
      setShowModal(true);
    }
  }, [activatePlayer]);

  const handleAccept = useCallback(() => {
    saveConsent(VIDEO_CATEGORY);
    setShowModal(false);
    activatePlayer();
  }, [activatePlayer]);

  const handleReject = useCallback(() => setShowModal(false), []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        handlePlayClick();
      }
    },
    [handlePlayClick]
  );

  // ── Placeholder vidéo non disponible ────────────────────────────────────────
  if (isBroken) {
    return (
      <div
        className={`flex flex-col items-center justify-center gap-2 rounded-lg bg-muted text-muted-foreground ${className}`}
        style={{ aspectRatio: ASPECT[platform] }}
        role="img"
        aria-label="Vidéo non disponible"
      >
        <VideoOff className="h-8 w-8 opacity-40" />
        <span className="text-sm">Vidéo non disponible</span>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* ── Lecteur ──────────────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden rounded-lg bg-black"
        style={{ aspectRatio: ASPECT[platform] }}
      >
        {playing ? (
          /* Iframe insérée UNIQUEMENT après clic + consentement */
          embedHtml ? (
            <div
              className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full [&>iframe]:border-0"
              dangerouslySetInnerHTML={{ __html: embedHtml }}
            />
          ) : (
            <iframe
              src={url}
              title={`Vidéo ${platformName}`}
              className="absolute inset-0 h-full w-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              loading="lazy"
            />
          )
        ) : (
          /* Vignette + bouton lecture */
          <button
            ref={playBtnRef}
            type="button"
            onClick={handlePlayClick}
            onKeyDown={handleKeyDown}
            aria-label={`Lire la vidéo ${platformName}`}
            className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center rounded-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-400 focus-visible:ring-offset-2"
          >
            {thumbnailUrl ? (
              <img
                src={thumbnailUrl}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 h-full w-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="absolute inset-0 bg-gray-900" aria-hidden="true" />
            )}

            {/* Overlay sombre */}
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/45"
            />

            {/* Bouton lecture */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform group-hover:scale-110">
                <Play className="ml-1 h-6 w-6 fill-current text-gray-900" />
              </div>
              <span className="text-sm font-medium text-white drop-shadow">
                Lire la vidéo
              </span>
            </div>
          </button>
        )}
      </div>

      {/* ── Lien externe ─────────────────────────────────────────────────────── */}
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={`Voir sur ${platformName} (nouvel onglet)`}
        className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        <ExternalLink className="h-3 w-3" aria-hidden="true" />
        Voir sur {platformName}
      </a>

      {/* ── Modale de consentement Loi 25 ────────────────────────────────────── */}
      {showModal && (
        <ConsentModal
          platformName={platformName}
          onAccept={handleAccept}
          onReject={handleReject}
        />
      )}
    </div>
  );
}

// ── Modale de consentement ────────────────────────────────────────────────────

interface ConsentModalProps {
  platformName: string;
  onAccept: () => void;
  onReject: () => void;
}

function ConsentModal({ platformName, onAccept, onReject }: ConsentModalProps) {
  const acceptRef = useRef<HTMLButtonElement>(null);

  // Focus sur "Accepter" à l'ouverture
  useEffect(() => { acceptRef.current?.focus(); }, []);

  // Fermeture au clavier (Escape)
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") onReject();
    },
    [onReject]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="consent-title"
      aria-describedby="consent-desc"
      onKeyDown={handleKeyDown}
      className="absolute inset-0 z-20 flex items-center justify-center rounded-lg bg-black/60 p-4"
    >
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 id="consent-title" className="text-base font-semibold">
            Témoins tiers requis
          </h2>
          <button
            type="button"
            onClick={onReject}
            aria-label="Fermer"
            className="text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p id="consent-desc" className="mb-5 text-sm text-muted-foreground">
          Pour lire cette vidéo,{" "}
          <strong className="text-foreground">{platformName}</strong> doit
          déposer des témoins (cookies) sur votre appareil. Conformément à la{" "}
          <strong>Loi 25</strong>, votre consentement explicite est requis.
        </p>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" size="sm" onClick={onReject}>
            Refuser
          </Button>
          <Button
            ref={acceptRef}
            type="button"
            variant="hero"
            size="sm"
            onClick={onAccept}
          >
            Accepter
          </Button>
        </div>
      </div>
    </div>
  );
}
