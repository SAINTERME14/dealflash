import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

const STORAGE_KEY = "dealflash_cookie_consent_v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) setVisible(true);
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: true, date: new Date().toISOString() }));
    setVisible(false);
  };

  const refuse = () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ accepted: false, date: new Date().toISOString() }));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Consentement aux témoins"
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 bg-card border border-border shadow-elevated rounded-lg p-4"
    >
      <div className="flex items-start gap-3">
        <div className="flex-1">
          <h2 className="font-semibold mb-1">🍪 Témoins de navigation</h2>
          <p className="text-sm text-muted-foreground mb-3">
            Nous utilisons uniquement des témoins essentiels pour le fonctionnement du site
            (session, sécurité). Aucun suivi publicitaire.{" "}
            <Link to="/politique-confidentialite" className="text-accent underline">
              En savoir plus
            </Link>
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="hero" onClick={accept}>
              Accepter
            </Button>
            <Button size="sm" variant="outline" onClick={refuse}>
              Refuser
            </Button>
          </div>
        </div>
        <button
          onClick={refuse}
          aria-label="Fermer"
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
