import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Plus, Pencil, Trash2, Package } from "lucide-react";
import { toast } from "sonner";

interface DealflashProduct {
  id: string;
  internal_sku: string;
  title: string;
  description: string | null;
  cost_price: number;
  margin_percent: number;
  selling_price: number;
  currency: string;
  stock_quantity: number | null;
  status: "draft" | "listed" | "paused" | "archived";
  images: string[];
  supplier_product_id: string | null;
  listing_id: string | null;
  internal_notes: string | null;
}

const statusVariants: Record<string, "default" | "secondary" | "outline"> = {
  draft: "outline",
  listed: "default",
  paused: "secondary",
  archived: "outline",
};

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  listed: "En ligne",
  paused: "En pause",
  archived: "Archivé",
};

export default function AdminDropshipping() {
  const [products, setProducts] = useState<DealflashProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DealflashProduct | null>(null);

  const [form, setForm] = useState({
    internal_sku: "",
    title: "",
    description: "",
    cost_price: "0",
    margin_percent: "30",
    selling_price: "0",
    stock_quantity: "",
    status: "draft" as DealflashProduct["status"],
    internal_notes: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("dealflash_products")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setProducts((data ?? []) as DealflashProduct[]);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Catalogue dropshipping — Admin DealFlash";
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({
      internal_sku: "",
      title: "",
      description: "",
      cost_price: "0",
      margin_percent: "30",
      selling_price: "0",
      stock_quantity: "",
      status: "draft",
      internal_notes: "",
    });
  };

  const openNew = () => {
    resetForm();
    setOpen(true);
  };

  const openEdit = (p: DealflashProduct) => {
    setEditing(p);
    setForm({
      internal_sku: p.internal_sku,
      title: p.title,
      description: p.description ?? "",
      cost_price: String(p.cost_price),
      margin_percent: String(p.margin_percent),
      selling_price: String(p.selling_price),
      stock_quantity: p.stock_quantity?.toString() ?? "",
      status: p.status,
      internal_notes: p.internal_notes ?? "",
    });
    setOpen(true);
  };

  const recalcSelling = (cost: string, margin: string) => {
    const c = parseFloat(cost) || 0;
    const m = parseFloat(margin) || 0;
    const s = c * (1 + m / 100);
    setForm((f) => ({ ...f, cost_price: cost, margin_percent: margin, selling_price: s.toFixed(2) }));
  };

  const save = async () => {
    if (!form.internal_sku.trim() || !form.title.trim()) {
      toast.error("SKU et titre requis");
      return;
    }
    const payload = {
      internal_sku: form.internal_sku.trim(),
      title: form.title.trim(),
      description: form.description.trim() || null,
      cost_price: parseFloat(form.cost_price) || 0,
      margin_percent: parseFloat(form.margin_percent) || 0,
      selling_price: parseFloat(form.selling_price) || 0,
      stock_quantity: form.stock_quantity ? parseInt(form.stock_quantity) : null,
      status: form.status,
      internal_notes: form.internal_notes.trim() || null,
    };

    if (editing) {
      const { error } = await supabase.from("dealflash_products").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Produit mis à jour");
    } else {
      const { error } = await supabase.from("dealflash_products").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Produit créé");
    }
    setOpen(false);
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce produit ?")) return;
    const { error } = await supabase.from("dealflash_products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Produit supprimé");
      load();
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Package className="h-7 w-7" /> Catalogue dropshipping
            </h1>
            <p className="text-muted-foreground mt-1">
              Produits vendus officiellement par DealFlash via fournisseurs externes.
            </p>
          </div>
          <Button onClick={openNew} variant="hero">
            <Plus className="h-4 w-4" /> Nouveau produit
          </Button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : products.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground mb-4">Aucun produit DealFlash dans le catalogue.</p>
            <Button onClick={openNew} variant="hero">
              Créer le premier produit
            </Button>
          </Card>
        ) : (
          <div className="grid gap-3">
            {products.map((p) => (
              <Card key={p.id} className="p-4 flex flex-col sm:flex-row gap-4 items-start">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={statusVariants[p.status]}>{statusLabels[p.status]}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{p.internal_sku}</span>
                  </div>
                  <h3 className="font-medium">{p.title}</h3>
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                    <span>Coût : {p.cost_price.toFixed(2)} {p.currency}</span>
                    <span>Marge : {p.margin_percent}%</span>
                    <span className="font-semibold text-primary">Vente : {p.selling_price.toFixed(2)} {p.currency}</span>
                    {p.stock_quantity !== null && <span>Stock : {p.stock_quantity}</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => openEdit(p)} variant="outline" size="sm">
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button onClick={() => remove(p.id)} variant="ghost" size="sm" className="text-destructive">
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader>
              <DialogTitle>{editing ? "Modifier le produit" : "Nouveau produit DealFlash"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>SKU interne *</Label>
                  <Input value={form.internal_sku} onChange={(e) => setForm({ ...form, internal_sku: e.target.value })} placeholder="DF-001" />
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as DealflashProduct["status"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Brouillon</SelectItem>
                      <SelectItem value="listed">En ligne</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Titre *</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label>Coût (CAD)</Label>
                  <Input type="number" step="0.01" value={form.cost_price} onChange={(e) => recalcSelling(e.target.value, form.margin_percent)} />
                </div>
                <div>
                  <Label>Marge (%)</Label>
                  <Input type="number" step="0.1" value={form.margin_percent} onChange={(e) => recalcSelling(form.cost_price, e.target.value)} />
                </div>
                <div>
                  <Label>Prix de vente</Label>
                  <Input type="number" step="0.01" value={form.selling_price} onChange={(e) => setForm({ ...form, selling_price: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Stock</Label>
                <Input type="number" value={form.stock_quantity} onChange={(e) => setForm({ ...form, stock_quantity: e.target.value })} placeholder="Vide = illimité" />
              </div>
              <div>
                <Label>Notes internes</Label>
                <Textarea rows={2} value={form.internal_notes} onChange={(e) => setForm({ ...form, internal_notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save} variant="hero">{editing ? "Enregistrer" : "Créer"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
