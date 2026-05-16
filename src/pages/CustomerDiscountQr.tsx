import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { getQrAttribution } from "@/lib/qrAttribution";

type Listing = { id: string; title: string; price: number; currency: string };
type Qr = { id: string; code: string; discount_pct: number | null; expires_at: string | null };

function randomCode(len = 10) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  const bytes = crypto.getRandomValues(new Uint8Array(len));
  for (const b of bytes) out += alphabet[b % alphabet.length];
  return out;
}

export default function CustomerDiscountQr() {
  const { listingId } = useParams<{ listingId: string }>();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [listing, setListing] = useState<Listing | null>(null);
  const [qr, setQr] = useState<Qr | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user || !listingId) return;
      setLoading(true);

      const { data: l } = await supabase
        .from("listings")
        .select("id, title, price, currency")
        .eq("id", listingId)
        .maybeSingle();
      if (cancelled) return;
      if (!l) {
        setError("Annonce introuvable");
        setLoading(false);
        return;
      }
      setListing(l as Listing);

      // QR rabais existant ?
      const { data: existing } = await supabase
        .from("qr_codes")
        .select("id, code, discount_pct, expires_at")
        .eq("owner_user_id", user.id)
        .eq("owner_role", "buyer")
        .eq("target_type", "product")
        .eq("target_id", listingId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      if (existing) {
        setQr(existing as Qr);
        setLoading(false);
        return;
      }

      // Récupérer le rabais hérité du QR d'affiliation source (si présent)
      const attr = getQrAttribution();
      let discount: number | null = null;
      if (attr?.qr_id) {
        const { data: src } = await supabase
          .from("qr_codes")
          .select("discount_pct")
          .eq("id", attr.qr_id)
          .maybeSingle();
        discount = (src as { discount_pct: number | null } | null)?.discount_pct ?? null;
      }

      const expires = new Date();
      expires.setDate(expires.getDate() + 7);

      const { data: created, error: insErr } = await supabase
        .from("qr_codes")
        .insert({
          owner_user_id: user.id,
          owner_role: "buyer",
          target_type: "product",
          target_id: listingId,
          discount_pct: discount,
          expires_at: expires.toISOString(),
          code: randomCode(),
          is_active: true,
        })
        .select("id, code, discount_pct, expires_at")
        .maybeSingle();

      if (cancelled) return;
      if (insErr) setError(insErr.message);
      else setQr(created as Qr);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [user, listingId]);

  if (!user) {
    return (
      <div className="container max-w-md py-10 text-center space-y-4">
        <h1 className="text-xl font-semibold">Connectez-vous pour obtenir votre rabais</h1>
        <Button asChild>
          <Link to={`/auth?redirect=${encodeURIComponent(`/mon-rabais/${listingId ?? ""}`)}`}>
            Se connecter
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container max-w-md py-8 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Mon QR de rabais</CardTitle>
          {listing && (
            <p className="text-sm text-muted-foreground">
              {listing.title} · {listing.price} {listing.currency}
            </p>
          )}
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {loading ? (
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          ) : error ? (
            <p className="text-sm text-destructive">{error}</p>
          ) : qr ? (
            <>
              <QRCodeSVG value={qr.code} size={220} includeMargin />
              <div className="text-center space-y-2">
                <code className="rounded bg-muted px-3 py-1 text-base font-mono">{qr.code}</code>
                <div className="flex justify-center gap-2">
                  {qr.discount_pct != null && (
                    <Badge variant="default">-{qr.discount_pct}%</Badge>
                  )}
                  {qr.expires_at && (
                    <Badge variant="outline">
                      Valable jusqu'au {new Date(qr.expires_at).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Présentez ce code au commerçant pour activer votre rabais.
                </p>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
