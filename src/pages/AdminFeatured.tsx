import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, Search, Sparkles } from "lucide-react";
import { Helmet } from "react-helmet-async";

type AdminListing = {
  id: string;
  title: string;
  price: number;
  currency: string;
  status: string;
  city: string | null;
  is_featured: boolean;
  featured_until: string | null;
  featured_priority: number;
  discount_percent: number | null;
};

function toLocalDateTimeInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d.getTime() - tz).toISOString().slice(0, 16);
}

export default function AdminFeatured() {
  const [listings, setListings] = useState<AdminListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "featured">("all");
  const [savingId, setSavingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("listings")
      .select(
        "id, title, price, currency, status, city, is_featured, featured_until, featured_priority, discount_percent"
      )
      .order("is_featured", { ascending: false })
      .order("featured_priority", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast.error("Erreur de chargement", { description: error.message });
    } else {
      setListings((data ?? []) as AdminListing[]);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return listings.filter((l) => {
      if (filter === "featured" && !l.is_featured) return false;
      if (!q) return true;
      return (
        l.title.toLowerCase().includes(q) ||
        (l.city ?? "").toLowerCase().includes(q)
      );
    });
  }, [listings, search, filter]);

  function patchLocal(id: string, patch: Partial<AdminListing>) {
    setListings((prev) => prev.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  async function saveRow(row: AdminListing) {
    setSavingId(row.id);
    const featuredUntilIso =
      row.featured_until && row.featured_until.length > 0
        ? new Date(row.featured_until).toISOString()
        : null;

    const { error } = await supabase
      .from("listings")
      .update({
        is_featured: row.is_featured,
        featured_until: featuredUntilIso,
        featured_priority: Number.isFinite(row.featured_priority) ? row.featured_priority : 0,
      })
      .eq("id", row.id);

    if (error) {
      toast.error("Sauvegarde impossible", { description: error.message });
    } else {
      toast.success("Mis à jour", {
        description: row.is_featured ? "Annonce sponsorisée activée" : "Boost désactivé",
      });
    }
    setSavingId(null);
    load();
  }

  return (
    <>
      <Helmet>
        <title>Admin — Sélection sponsorisée | DealFlash</title>
        <meta name="description" content="Panneau admin pour gérer les annonces en vedette sur DealFlash." />
      </Helmet>

      <div className="container py-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-accent flex items-center justify-center shadow-flash">
            <Sparkles className="h-5 w-5 text-accent-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Sélection sponsorisée</h1>
            <p className="text-sm text-muted-foreground">
              Activez le boost, fixez l'expiration et la priorité d'affichage.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Filtres</CardTitle>
            <CardDescription>Rechercher une annonce ou afficher uniquement les vedettes.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Titre ou ville…"
                className="pl-9"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant={filter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("all")}
              >
                Toutes
              </Button>
              <Button
                variant={filter === "featured" ? "default" : "outline"}
                size="sm"
                onClick={() => setFilter("featured")}
              >
                En vedette
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-16 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-muted-foreground">
                Aucune annonce trouvée.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Annonce</TableHead>
                    <TableHead className="w-28">Prix</TableHead>
                    <TableHead className="w-32">Boost</TableHead>
                    <TableHead className="w-56">Expiration</TableHead>
                    <TableHead className="w-28">Priorité</TableHead>
                    <TableHead className="w-32 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.title}</div>
                        <div className="text-xs text-muted-foreground flex items-center gap-2">
                          <span>{row.city ?? "—"}</span>
                          <Badge variant="outline" className="text-[10px]">{row.status}</Badge>
                          {row.discount_percent && row.discount_percent >= 10 ? (
                            <Badge className="text-[10px] bg-accent text-accent-foreground">
                              -{Math.round(row.discount_percent)}%
                            </Badge>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.price.toFixed(2)} {row.currency}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={row.is_featured}
                            onCheckedChange={(v) => patchLocal(row.id, { is_featured: v })}
                          />
                          <span className="text-xs text-muted-foreground">
                            {row.is_featured ? "Actif" : "Inactif"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="datetime-local"
                          value={toLocalDateTimeInput(row.featured_until)}
                          onChange={(e) =>
                            patchLocal(row.id, { featured_until: e.target.value || null })
                          }
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={row.featured_priority}
                          onChange={(e) =>
                            patchLocal(row.id, {
                              featured_priority: parseInt(e.target.value || "0", 10),
                            })
                          }
                          className="h-9"
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => saveRow(row)}
                          disabled={savingId === row.id}
                        >
                          {savingId === row.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Enregistrer"
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-muted-foreground">
          <Label className="font-medium">Astuce :</Label> seuls les comptes admin peuvent
          modifier ces champs (verrouillé côté base via les triggers de sécurité).
        </p>
      </div>
    </>
  );
}
