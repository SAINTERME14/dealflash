import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AdminTrendingProducts() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("trending_products" as any)
      .select("*").order("trend_score", { ascending: false }).limit(100);
    setItems((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const run = async () => {
    setRunning(true);
    const { data, error } = await supabase.functions.invoke("find-trending-products", {
      body: { limit_per_category: 5 },
    });
    setRunning(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${(data as any).inserted ?? 0} produits tendances détectés`);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-6 w-6" />Produits tendances</h1>
            <p className="text-sm text-muted-foreground">Détectés par l'IA depuis le catalogue fournisseur.</p>
          </div>
          <Button onClick={run} disabled={running}>
            {running ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
            Détecter les tendances
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
        ) : items.length === 0 ? (
          <Card className="p-10 text-center text-muted-foreground">
            Aucune tendance détectée. Cliquez sur « Détecter les tendances » pour lancer l'IA.
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map(it => (
              <Card key={it.id} className="p-4 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-medium text-sm line-clamp-2 flex-1">{it.title}</h4>
                  <Badge>{Math.round(it.trend_score)}</Badge>
                </div>
                {it.category && <Badge variant="outline" className="text-xs">{it.category}</Badge>}
                {it.recommended_price && (
                  <p className="text-sm">Prix conseillé : <strong>{it.recommended_price} {it.currency}</strong></p>
                )}
                {Array.isArray(it.reasons) && it.reasons.length > 0 && (
                  <ul className="text-xs text-muted-foreground space-y-0.5 list-disc list-inside">
                    {it.reasons.slice(0, 3).map((r: string, i: number) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
