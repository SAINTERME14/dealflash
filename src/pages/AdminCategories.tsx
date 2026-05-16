import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Category = {
  id: string;
  name: string;
  slug: string;
  parent_id: string | null;
  listing_type: "product" | "service" | "vehicle" | "rental" | "hotel";
  is_active: boolean;
  display_order: number;
};

export default function AdminCategories() {
  const [items, setItems] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [parentId, setParentId] = useState<string>("root");
  const [listingType, setListingType] = useState<Category["listing_type"]>("product");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    document.title = "Catégories | Admin Boardeal";
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("categories")
      .select("id,name,slug,parent_id,listing_type,is_active,display_order")
      .order("display_order")
      .order("name");
    setItems((data as Category[]) ?? []);
    setLoading(false);
  }

  async function createCategory() {
    if (!name.trim() || !slug.trim()) return toast.error("Nom et slug requis");
    setCreating(true);
    const { error } = await supabase.from("categories").insert({
      name: name.trim(),
      slug: slug.trim().toLowerCase().replace(/[^a-z0-9-]/g, "-"),
      parent_id: parentId === "root" ? null : parentId,
      listing_type: listingType,
      is_active: true,
      display_order: items.length,
    });
    setCreating(false);
    if (error) return toast.error(error.message);
    toast.success("Catégorie créée");
    setName(""); setSlug(""); setParentId("root");
    load();
  }

  async function toggleActive(c: Category) {
    const { error } = await supabase
      .from("categories")
      .update({ is_active: !c.is_active })
      .eq("id", c.id);
    if (error) return toast.error(error.message);
    setItems((prev) => prev.map((x) => (x.id === c.id ? { ...x, is_active: !c.is_active } : x)));
  }

  async function remove(c: Category) {
    if (!confirm(`Supprimer "${c.name}" ?`)) return;
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error(error.message);
    toast.success("Supprimée");
    load();
  }

  const roots = items.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => items.filter((c) => c.parent_id === id);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Catégories & sous-catégories</h1>
          <p className="text-sm text-muted-foreground">
            Hiérarchie configurable pour produits, services et petites annonces.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4" /> Nouvelle catégorie
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-5">
            <Input placeholder="Nom" value={name} onChange={(e) => setName(e.target.value)} />
            <Input placeholder="slug-url" value={slug} onChange={(e) => setSlug(e.target.value)} />
            <Select value={parentId} onValueChange={setParentId}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="root">Racine</SelectItem>
                {roots.map((r) => (
                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={listingType} onValueChange={(v) => setListingType(v as Category["listing_type"])}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product">Produit</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="petite_annonce">Petite annonce</SelectItem>
                <SelectItem value="ticket">Ticket</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={createCategory} disabled={creating}>
              {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : roots.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune catégorie.</p>
            ) : (
              <div className="divide-y">
                {roots.map((r) => (
                  <div key={r.id} className="p-3">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{r.listing_type}</Badge>
                      <div className="flex-1 font-medium">{r.name}</div>
                      <code className="text-xs text-muted-foreground">{r.slug}</code>
                      <Switch checked={r.is_active} onCheckedChange={() => toggleActive(r)} />
                      <Button size="icon" variant="ghost" onClick={() => remove(r)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                    <div className="mt-2 pl-4 space-y-1">
                      {childrenOf(r.id).map((c) => (
                        <div key={c.id} className="flex items-center gap-2 text-sm">
                          <ChevronRight className="h-3 w-3 text-muted-foreground" />
                          <div className="flex-1">{c.name}</div>
                          <code className="text-xs text-muted-foreground">{c.slug}</code>
                          <Switch checked={c.is_active} onCheckedChange={() => toggleActive(c)} />
                          <Button size="icon" variant="ghost" onClick={() => remove(c)}>
                            <Trash2 className="h-3 w-3 text-destructive" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
