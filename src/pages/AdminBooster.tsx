import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Rocket, Search } from "lucide-react";

type Row = {
  id: string;
  title: string;
  city: string | null;
  boost_weight: number;
  is_featured: boolean;
  status: string;
};

export default function AdminBooster() {
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("listings")
      .select("id, title, city, boost_weight, is_featured, status")
      .order("boost_weight", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(50);
    if (q.trim()) query = query.ilike("title", `%${q.trim()}%`);
    const { data, error } = await query;
    setLoading(false);
    if (error) toast({ title: "Erreur", description: error.message, variant: "destructive" });
    else setRows((data ?? []) as Row[]);
  };

  useEffect(() => {
    load();
  }, []);

  const setWeight = async (id: string, value: number) => {
    const { error } = await supabase
      .from("listings")
      .update({ boost_weight: value })
      .eq("id", id);
    if (error) toast({ title: "Refus", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Booster appliqué", description: `Poids = ${value}` });
      load();
    }
  };

  return (
    <div className="container max-w-5xl py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Booster — Campagnes géolocalisées</h1>
        <p className="text-sm text-muted-foreground">
          Pondérez la visibilité d'une annonce selon le plan payé par le commerçant. 0 = naturel.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recherche</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Titre de l'annonce…"
              onKeyDown={(e) => e.key === "Enter" && load()}
            />
            <Button onClick={load} disabled={loading}>
              <Search className="h-4 w-4 mr-2" /> Chercher
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Annonces ({rows.length})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {rows.length === 0 && !loading && (
            <p className="text-sm text-muted-foreground">Aucune annonce.</p>
          )}
          {rows.map((r) => (
            <BoostRow key={r.id} row={r} onSet={setWeight} />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

function BoostRow({ row, onSet }: { row: Row; onSet: (id: string, w: number) => void }) {
  const [val, setVal] = useState<string>(String(row.boost_weight));
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border p-3">
      <div className="min-w-0">
        <p className="font-medium truncate">{row.title}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="outline">{row.city ?? "—"}</Badge>
          <Badge variant={row.is_featured ? "default" : "secondary"}>
            {row.is_featured ? "Vedette" : row.status}
          </Badge>
          <Badge variant="outline">poids actuel : {row.boost_weight}</Badge>
        </div>
      </div>
      <div className="flex items-end gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Nouveau poids</Label>
          <Input
            type="number"
            min="0"
            max="1000"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="w-28"
          />
        </div>
        <Button size="sm" onClick={() => onSet(row.id, Number(val) || 0)}>
          <Rocket className="h-4 w-4 mr-1" /> Appliquer
        </Button>
      </div>
    </div>
  );
}
