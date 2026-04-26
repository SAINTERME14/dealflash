import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ShoppingCart, ExternalLink } from "lucide-react";
import { toast } from "sonner";

type OrderStatus = "pending" | "ordered" | "shipped" | "delivered" | "cancelled" | "refunded";

interface DropshipOrder {
  id: string;
  status: OrderStatus;
  quantity: number;
  cost_amount: number;
  currency: string;
  external_order_id: string | null;
  tracking_number: string | null;
  tracking_url: string | null;
  notes: string | null;
  created_at: string;
  ordered_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  supplier_id: string;
  dealflash_product_id: string;
  ticket_id: string | null;
  dealflash_products?: { title: string; internal_sku: string } | null;
  suppliers?: { name: string } | null;
}

const statusVariants: Record<OrderStatus, "default" | "secondary" | "outline" | "destructive"> = {
  pending: "outline",
  ordered: "secondary",
  shipped: "default",
  delivered: "default",
  cancelled: "destructive",
  refunded: "destructive",
};

const statusLabels: Record<OrderStatus, string> = {
  pending: "En attente",
  ordered: "Commandée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
  refunded: "Remboursée",
};

export default function AdminDropshipOrders() {
  const [orders, setOrders] = useState<DropshipOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<OrderStatus | "all">("all");
  const [editing, setEditing] = useState<DropshipOrder | null>(null);
  const [form, setForm] = useState({
    status: "pending" as OrderStatus,
    external_order_id: "",
    tracking_number: "",
    tracking_url: "",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    let query = supabase
      .from("dropship_orders")
      .select("*, dealflash_products(title, internal_sku), suppliers(name)")
      .order("created_at", { ascending: false });
    if (filter !== "all") query = query.eq("status", filter);
    const { data, error } = await query;
    if (error) toast.error(error.message);
    else setOrders((data ?? []) as DropshipOrder[]);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Commandes dropshipping — Admin DealFlash";
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);

  const openEdit = (o: DropshipOrder) => {
    setEditing(o);
    setForm({
      status: o.status,
      external_order_id: o.external_order_id ?? "",
      tracking_number: o.tracking_number ?? "",
      tracking_url: o.tracking_url ?? "",
      notes: o.notes ?? "",
    });
  };

  const save = async () => {
    if (!editing) return;
    const { error } = await supabase.from("dropship_orders").update({
      status: form.status,
      external_order_id: form.external_order_id.trim() || null,
      tracking_number: form.tracking_number.trim() || null,
      tracking_url: form.tracking_url.trim() || null,
      notes: form.notes.trim() || null,
    }).eq("id", editing.id);
    if (error) return toast.error(error.message);
    toast.success("Commande mise à jour");
    setEditing(null);
    load();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <ShoppingCart className="h-7 w-7" /> Commandes dropshipping
            </h1>
            <p className="text-muted-foreground mt-1">
              Suivi des commandes passées aux fournisseurs externes.
            </p>
          </div>
          <Select value={filter} onValueChange={(v) => setFilter(v as OrderStatus | "all")}>
            <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {Object.entries(statusLabels).map(([k, v]) => (
                <SelectItem key={k} value={k}>{v}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : orders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Aucune commande dropshipping.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {orders.map((o) => (
              <Card key={o.id} className="p-4">
                <div className="flex flex-col sm:flex-row gap-4 justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={statusVariants[o.status]}>{statusLabels[o.status]}</Badge>
                      <span className="text-xs text-muted-foreground font-mono">
                        {o.dealflash_products?.internal_sku ?? "—"}
                      </span>
                      {o.suppliers?.name && (
                        <span className="text-xs text-muted-foreground">via {o.suppliers.name}</span>
                      )}
                    </div>
                    <h3 className="font-medium">{o.dealflash_products?.title ?? "Produit supprimé"}</h3>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground mt-1">
                      <span>Qté : {o.quantity}</span>
                      <span>Coût : {o.cost_amount.toFixed(2)} {o.currency}</span>
                      {o.tracking_number && (
                        <span>
                          Suivi : {o.tracking_url ? (
                            <a href={o.tracking_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline inline-flex items-center gap-1">
                              {o.tracking_number} <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : o.tracking_number}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button onClick={() => openEdit(o)} variant="outline" size="sm" className="self-start">
                    Modifier
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Mettre à jour la commande</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Statut</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as OrderStatus })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(statusLabels).map(([k, v]) => (
                      <SelectItem key={k} value={k}>{v}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Référence commande fournisseur</Label>
                <Input value={form.external_order_id} onChange={(e) => setForm({ ...form, external_order_id: e.target.value })} />
              </div>
              <div>
                <Label>Numéro de suivi</Label>
                <Input value={form.tracking_number} onChange={(e) => setForm({ ...form, tracking_number: e.target.value })} />
              </div>
              <div>
                <Label>URL de suivi</Label>
                <Input value={form.tracking_url} onChange={(e) => setForm({ ...form, tracking_url: e.target.value })} placeholder="https://..." />
              </div>
              <div>
                <Label>Notes internes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditing(null)}>Annuler</Button>
              <Button onClick={save} variant="hero">Enregistrer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
