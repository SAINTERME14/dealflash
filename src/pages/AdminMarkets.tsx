import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Globe, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type Market = {
  id: string;
  country_code: string;
  name: string;
  currency: string;
  languages: string[];
  status: "active" | "inactive";
  is_default: boolean;
};

export default function AdminMarkets() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [draft, setDraft] = useState({
    country_code: "",
    name: "",
    currency: "CAD",
    languages: "fr,en",
  });

  useEffect(() => {
    document.title = "Admin · Marchés | Boardeal";
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("markets")
      .select("*")
      .order("is_default", { ascending: false })
      .order("country_code");
    setMarkets((data as Market[]) ?? []);
    setLoading(false);
  }

  async function create() {
    if (!draft.country_code || !draft.name) {
      toast.error("Code pays et nom requis");
      return;
    }
    setCreating(true);
    const { error } = await supabase.from("markets").insert({
      country_code: draft.country_code.toUpperCase(),
      name: draft.name,
      currency: draft.currency.toUpperCase(),
      languages: draft.languages.split(",").map((s) => s.trim()).filter(Boolean),
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Marché créé");
    setDraft({ country_code: "", name: "", currency: "CAD", languages: "fr,en" });
    load();
  }

  async function toggleStatus(m: Market) {
    const next = m.status === "active" ? "inactive" : "active";
    const { error } = await supabase
      .from("markets")
      .update({ status: next })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  }

  async function setDefault(m: Market) {
    await supabase.from("markets").update({ is_default: false }).neq("id", m.id);
    const { error } = await supabase
      .from("markets")
      .update({ is_default: true })
      .eq("id", m.id);
    if (error) return toast.error(error.message);
    toast.success(`${m.name} marqué par défaut`);
    load();
  }

  async function remove(m: Market) {
    if (m.is_default) return toast.error("Impossible de supprimer le marché par défaut");
    if (!confirm(`Supprimer ${m.name} ?`)) return;
    const { error } = await supabase.from("markets").delete().eq("id", m.id);
    if (error) return toast.error(error.message);
    load();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Globe className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Marchés</h1>
            <p className="text-sm text-muted-foreground">
              Pays, devise et langues actives sur la plateforme.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Ajouter un marché</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-5">
              <Input
                placeholder="FR"
                maxLength={2}
                value={draft.country_code}
                onChange={(e) => setDraft({ ...draft, country_code: e.target.value })}
              />
              <Input
                placeholder="France"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                className="sm:col-span-2"
              />
              <Input
                placeholder="EUR"
                value={draft.currency}
                onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
              />
              <Input
                placeholder="fr,en"
                value={draft.languages}
                onChange={(e) => setDraft({ ...draft, languages: e.target.value })}
              />
            </div>
            <Button onClick={create} disabled={creating} className="mt-3">
              {creating ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
              Créer
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pays</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Devise</TableHead>
                    <TableHead>Langues</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Par défaut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {markets.map((m) => (
                    <TableRow key={m.id}>
                      <TableCell className="font-mono">{m.country_code}</TableCell>
                      <TableCell className="font-medium">{m.name}</TableCell>
                      <TableCell>{m.currency}</TableCell>
                      <TableCell className="text-xs">{m.languages.join(", ")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={m.status === "active"}
                            onCheckedChange={() => toggleStatus(m)}
                          />
                          <Badge variant={m.status === "active" ? "default" : "secondary"}>
                            {m.status}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {m.is_default ? (
                          <Badge>Défaut</Badge>
                        ) : (
                          <Button size="sm" variant="ghost" onClick={() => setDefault(m)}>
                            Définir
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => remove(m)}
                          disabled={m.is_default}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
