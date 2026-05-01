import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Loader2, Star, Info } from "lucide-react";

interface Props {
  listingId: string;
  vendorId: string;
  regularPrice: number;
  currency?: string;
  /** Appelé quand l'utilisateur valide l'utilisation de ses points */
  onApplyDiscount?: (discountPercent: number, pointsUsed: number) => void;
}

const fmt = (n: number, currency = "CAD") =>
  new Intl.NumberFormat("fr-CA", { style: "currency", currency, maximumFractionDigits: 2 }).format(n);

export function LoyaltyPointsPanel({ listingId, vendorId, regularPrice, currency = "CAD", onApplyDiscount }: Props) {
  const { user } = useAuth();
  const [balance, setBalance] = useState<number | null>(null);
  const [pointsToUse, setPointsToUse] = useState(0);
  const [discountPct, setDiscountPct] = useState(0);
  const [loading, setLoading] = useState(false);
  const [applied, setApplied] = useState(false);

  // Max utilisable : 1000 pts = 10%
  const maxUsable = Math.min(balance ?? 0, 1000);
  const maxDiscount = Math.floor(maxUsable / 100);

  useEffect(() => {
    if (!user || !vendorId) return;
    supabase
      .from("loyalty_points")
      .select("points")
      .eq("user_id", user.id)
      .eq("vendor_id", vendorId)
      .maybeSingle()
      .then(({ data }) => setBalance(data?.points ?? 0));
  }, [user, vendorId]);

  const handleSlider = async (value: number[]) => {
    const pts = value[0];
    setPointsToUse(pts);
    setApplied(false);
    if (pts === 0) { setDiscountPct(0); return; }
    setLoading(true);
    const { data } = await supabase.rpc("get_loyalty_discount", {
      p_listing_id: listingId,
      p_points_to_use: pts,
    });
    setDiscountPct(data?.discount_percent ?? 0);
    setLoading(false);
  };

  const handleApply = () => {
    if (discountPct <= 0) return;
    setApplied(true);
    onApplyDiscount?.(discountPct, pointsToUse);
  };

  if (!user || balance === null) return null;
  if (balance === 0) return (
    <div className="text-xs text-muted-foreground flex items-center gap-1">
      <Star className="h-3.5 w-3.5 text-yellow-500" />
      Vous n'avez pas encore de points de fidélité chez ce vendeur.
    </div>
  );

  const finalPrice = regularPrice * (1 - discountPct / 100);

  return (
    <Card className="p-4 space-y-3 border-yellow-200 bg-yellow-50/60">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          <span className="font-medium text-sm">Points de fidélité</span>
        </div>
        <Badge variant="secondary" className="gap-1">
          {balance} pts
        </Badge>
      </div>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
        <span>
          100 pts = 1 % de rabais · Plafond 10 % · Valable uniquement sur ce produit à prix régulier.
          Le coût du rabais est absorbé par le vendeur.
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Points à utiliser</span>
          <span className="font-medium">{pointsToUse} pts → {discountPct.toFixed(1)} %</span>
        </div>
        <Slider
          min={0}
          max={maxUsable}
          step={100}
          value={[pointsToUse]}
          onValueChange={handleSlider}
          disabled={loading}
          className="w-full"
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>0</span>
          <span>{maxUsable} pts max ({maxDiscount} %)</span>
        </div>
      </div>

      {pointsToUse > 0 && (
        <div className="rounded-md bg-white border border-yellow-200 p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Prix régulier</span>
            <span>{fmt(regularPrice, currency)}</span>
          </div>
          <div className="flex justify-between text-green-700">
            <span>Rabais points (−{discountPct.toFixed(1)} %)</span>
            <span>−{fmt(regularPrice * discountPct / 100, currency)}</span>
          </div>
          <div className="flex justify-between font-bold border-t border-yellow-100 pt-1">
            <span>Prix final au vendeur</span>
            {loading
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <span className="text-green-700">{fmt(finalPrice, currency)}</span>
            }
          </div>
        </div>
      )}

      {pointsToUse > 0 && !applied && (
        <Button
          size="sm"
          className="w-full"
          onClick={handleApply}
          disabled={loading || discountPct === 0}
        >
          Appliquer {pointsToUse} pts (−{discountPct.toFixed(1)} %)
        </Button>
      )}

      {applied && (
        <p className="text-xs text-green-700 font-medium text-center">
          ✅ Rabais de {discountPct.toFixed(1)} % appliqué sur le bon de commande
        </p>
      )}
    </Card>
  );
}
