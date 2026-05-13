import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/customClient";
import { setQrAttribution } from "@/lib/qrAttribution";

export default function QrRedirect() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!code) {
        setError("Code QR manquant");
        return;
      }
      try {
        const { data, error: invokeErr } = await supabase.functions.invoke("qr-track", {
          body: {
            code,
            referrer: typeof document !== "undefined" ? document.referrer : null,
          },
        });
        if (cancelled) return;
        if (invokeErr || !data?.target_url) {
          setError(invokeErr?.message || data?.error || "QR introuvable ou expiré");
          return;
        }
        setQrAttribution({
          qr_code: data.qr_code,
          qr_id: data.qr_id,
          owner_user_id: data.owner_user_id,
          owner_role: data.owner_role,
        });
        // Redirection vers la cible (interne)
        const target = String(data.target_url);
        if (target.startsWith("http")) {
          window.location.replace(target);
        } else {
          navigate(target, { replace: true });
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Erreur");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code, navigate]);

  if (error) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 px-4 text-center">
        <h1 className="text-xl font-semibold">QR invalide</h1>
        <p className="text-muted-foreground">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="mt-2 px-4 py-2 rounded-md bg-primary text-primary-foreground"
        >
          Retour à l'accueil
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-muted-foreground">Redirection en cours…</p>
    </div>
  );
}
