import { useRef } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Printer, ShieldCheck, Info } from "lucide-react";

export interface BonDeCommandeData {
  ticket_id: string;
  confirmation_code: string;
  confirmed_at: string;
  expires_at: string;

  listing_id: string;
  listing_title: string;
  listing_city?: string | null;
  listing_region?: string | null;

  currency: string;
  regular_price?: number | null;
  base_discount_percent?: number | null;
  social_bonus_percent?: number | null;
  group_bonus_percent?: number | null;
  total_discount_percent?: number | null;
  final_price: number;
  platform_fee: number;

  seller_name?: string | null;
  seller_phone?: string | null;
  seller_email?: string | null;
  seller_city?: string | null;
  seller_address?: string | null;
  payment_methods?: string[];
  pickup_info?: string | null;
  delivery_info?: string | null;

  buyer_name: string;
  buyer_email: string;
  buyer_phone: string;

  qr_url: string;
}

interface Props {
  bon: BonDeCommandeData;
}

const fmt = (amount: number, currency = "CAD") =>
  new Intl.NumberFormat("fr-CA", {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(amount);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-CA", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function BonDeCommande({ bon }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current?.innerHTML ?? "";
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>Bon de commande Boardeal</title>
      <style>
        body { font-family: sans-serif; padding: 24px; font-size: 14px; }
        .section { margin-bottom: 16px; border: 1px solid #ddd; padding: 12px; border-radius: 8px; }
        .label { color: #666; font-size: 12px; margin-bottom: 2px; }
        .value { font-weight: 600; }
        .alert { background: #fef9c3; border: 1px solid #facc15; padding: 10px; border-radius: 6px; }
        table { width: 100%; border-collapse: collapse; }
        td { padding: 4px 0; }
        td:last-child { text-align: right; font-weight: 600; }
        h1 { font-size: 20px; } h2 { font-size: 16px; margin: 0 0 8px; }
        .qr { text-align: center; margin: 16px 0; }
        .final { font-size: 20px; color: #16a34a; }
      </style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.print();
  };

  const hasDiscount =
    bon.total_discount_percent != null && bon.total_discount_percent > 0;

  return (
    <div>
      {/* Bouton impression (hors zone imprimée) */}
      <div className="flex justify-end mb-4 print:hidden">
        <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
          <Printer className="h-4 w-4" /> Imprimer / PDF
        </Button>
      </div>

      <div ref={printRef} className="space-y-4">
        {/* En-tête */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">Bon de commande</h2>
            <p className="text-xs text-muted-foreground font-mono">
              #{bon.confirmation_code} · {fmtDate(bon.confirmed_at)}
            </p>
          </div>
          <Badge variant="secondary" className="gap-1">
            <ShieldCheck className="h-3 w-3" /> Signé cryptographiquement
          </Badge>
        </div>

        {/* Avertissement facilitateur — CRITIQUE légalement */}
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3 flex gap-2 text-sm">
          <Info className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-amber-800">
            <strong>Boardeal est un facilitateur.</strong> Le paiement du produit
            ({fmt(bon.final_price, bon.currency)}) se fait{" "}
            <strong>directement au vendeur</strong> — Interac, virement, terminal
            ou comptant. Boardeal n'encaisse que les frais de réservation ({fmt(bon.platform_fee, bon.currency)}).
          </p>
        </div>

        {/* QR Code */}
        <Card className="p-4 flex flex-col items-center gap-3">
          <QRCodeSVG value={bon.qr_url} size={180} level="H" includeMargin />
          <p className="text-xs text-muted-foreground text-center">
            Le vendeur scanne ce code pour valider votre rabais
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Code : {bon.confirmation_code}
          </p>
        </Card>

        {/* Détail produit + prix */}
        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Produit</h3>
          <p className="font-medium">{bon.listing_title}</p>
          {(bon.listing_city || bon.listing_region) && (
            <p className="text-sm text-muted-foreground">
              📍 {[bon.listing_city, bon.listing_region].filter(Boolean).join(", ")}
            </p>
          )}

          <table className="w-full text-sm mt-2">
            <tbody>
              {bon.regular_price != null && (
                <tr>
                  <td className="text-muted-foreground">Prix régulier</td>
                  <td className="text-right">{fmt(bon.regular_price, bon.currency)}</td>
                </tr>
              )}
              {bon.base_discount_percent != null && bon.base_discount_percent > 0 && (
                <tr>
                  <td className="text-muted-foreground">Rabais de base</td>
                  <td className="text-right text-green-600">− {bon.base_discount_percent.toFixed(1)} %</td>
                </tr>
              )}
              {bon.social_bonus_percent != null && bon.social_bonus_percent > 0 && (
                <tr>
                  <td className="text-muted-foreground">Bonus partage social</td>
                  <td className="text-right text-green-600">− {bon.social_bonus_percent.toFixed(1)} %</td>
                </tr>
              )}
              {bon.group_bonus_percent != null && bon.group_bonus_percent > 0 && (
                <tr>
                  <td className="text-muted-foreground">Bonus de groupe</td>
                  <td className="text-right text-green-600">− {bon.group_bonus_percent.toFixed(1)} %</td>
                </tr>
              )}
              {hasDiscount && (
                <tr className="border-t border-border">
                  <td className="text-muted-foreground pt-2">Rabais total</td>
                  <td className="text-right text-green-600 pt-2 font-bold">
                    − {bon.total_discount_percent!.toFixed(1)} %
                  </td>
                </tr>
              )}
              <tr className="border-t border-border">
                <td className="pt-3 font-bold text-base">
                  Prix à payer au vendeur
                </td>
                <td className="pt-3 text-right font-bold text-xl text-green-700">
                  {fmt(bon.final_price, bon.currency)}
                </td>
              </tr>
            </tbody>
          </table>
        </Card>

        {/* Coordonnées vendeur */}
        <Card className="p-4 space-y-2">
          <h3 className="font-semibold">Coordonnées du vendeur</h3>
          <p className="font-medium">{bon.seller_name ?? "Vendeur"}</p>
          {bon.seller_phone && (
            <p className="text-sm">
              📞{" "}
              <a href={`tel:${bon.seller_phone}`} className="underline">
                {bon.seller_phone}
              </a>
            </p>
          )}
          {bon.seller_email && (
            <p className="text-sm">
              ✉️{" "}
              <a href={`mailto:${bon.seller_email}`} className="underline">
                {bon.seller_email}
              </a>
            </p>
          )}
          {bon.seller_address && (
            <p className="text-sm">📍 {bon.seller_address}</p>
          )}
          {bon.seller_city && !bon.seller_address && (
            <p className="text-sm">📍 {bon.seller_city}</p>
          )}

          {bon.payment_methods && bon.payment_methods.length > 0 && (
            <div className="pt-1">
              <p className="text-xs text-muted-foreground mb-1">Paiements acceptés</p>
              <div className="flex flex-wrap gap-1">
                {bon.payment_methods.map((m) => (
                  <Badge key={m} variant="outline" className="text-xs capitalize">
                    {m}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* Modalités retrait/livraison */}
        {(bon.pickup_info || bon.delivery_info) && (
          <Card className="p-4 space-y-2">
            <h3 className="font-semibold">Modalités</h3>
            {bon.pickup_info && (
              <div>
                <p className="text-xs text-muted-foreground">Retrait</p>
                <p className="text-sm">{bon.pickup_info}</p>
              </div>
            )}
            {bon.delivery_info && (
              <div>
                <p className="text-xs text-muted-foreground">Livraison</p>
                <p className="text-sm">{bon.delivery_info}</p>
              </div>
            )}
          </Card>
        )}

        {/* Validité */}
        <Card className="p-4 text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Valide jusqu'au :</strong> {fmtDate(bon.expires_at)}
          </p>
          <p className="text-xs">
            Les taxes (TPS/TVQ), les retours et les garanties sont de la
            responsabilité exclusive du vendeur. Boardeal est un facilitateur de
            mise en relation et n'est pas partie à la transaction commerciale.
          </p>
        </Card>
      </div>
    </div>
  );
}
