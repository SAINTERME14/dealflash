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
import { Loader2, Plus, Pencil, Trash2, Globe } from "lucide-react";
import { toast } from "sonner";

type ChannelType = "amazon" | "temu" | "ebay" | "walmart" | "shopify" | "custom";
type ChannelStatus = "active" | "paused" | "disabled";

interface Channel {
  id: string;
  name: string;
  type: ChannelType;
  status: ChannelStatus;
  api_endpoint: string | null;
  notes: string | null;
}

const typeLabels: Record<ChannelType, string> = {
  amazon: "Amazon",
  temu: "Temu",
  ebay: "eBay",
  walmart: "Walmart",
  shopify: "Shopify",
  custom: "Personnalisé",
};

export default function AdminSalesChannels() {
  const [items, setItems] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Channel | null>(null);
  const [form, setForm] = useState({ name: "", type: "amazon" as ChannelType, status: "active" as ChannelStatus, api_endpoint: "", notes: "" });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("sales_channels").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Channel[]);
    setLoading(false);
  };

  useEffect(() => { document.title = "Canaux de vente — Admin DealFlash"; load(); }, []);

  const reset = () => { setEditing(null); setForm({ name: "", type: "amazon", status: "active", api_endpoint: "", notes: "" }); };

  const openEdit = (c: Channel) => {
    setEditing(c);
    setForm({ name: c.name, type: c.type, status: c.status, api_endpoint: c.api_endpoint ?? "", notes: c.notes ?? "" });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) return toast.error("Nom requis");
    const payload = { name: form.name.trim(), type: form.type, status: form.status, api_endpoint: form.api_endpoint.trim() || null, notes: form.notes.trim() || null };
    if (editing) {
      const { error } = await supabase.from("sales_channels").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Canal mis à jour");
    } else {
      const { error } = await supabase.from("sales_channels").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Canal ajouté");
    }
    setOpen(false); reset(); load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce canal ?")) return;
    const { error } = await supabase.from("sales_channels").delete().eq("id", id);
    if (error) toast.error(error.message); else { toast.success("Supprimé"); load(); }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2"><Globe className="h-7 w-7" /> Canaux de vente externes</h1>
            <p className="text-muted-foreground mt-1">Amazon, Temu, eBay, Walmart, Shopify ou autres marketplaces.</p>
          </div>
          <Button onClick={() => { reset(); setOpen(true); }} variant="hero"><Plus className="h-4 w-4" /> Nouveau canal</Button>
        </div>

        {loading ? <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          : items.length === 0 ? <Card className="p-12 text-center"><p className="text-muted-foreground">Aucun canal configuré.</p></Card>
          : <div className="grid gap-3">
            {items.map((c) => (
              <Card key={c.id} className="p-4 flex justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                    <Badge variant="outline">{typeLabels[c.type]}</Badge>
                  </div>
                  <h3 className="font-medium">{c.name}</h3>
                  {c.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{c.notes}</p>}
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button onClick={() => openEdit(c)} variant="outline" size="sm"><Pencil className="h-3 w-3" /></Button>
                  <Button onClick={() => remove(c.id)} variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </Card>
            ))}
          </div>}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau canal"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as ChannelType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as ChannelStatus })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="paused">En pause</SelectItem>
                      <SelectItem value="disabled">Désactivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div><Label>Endpoint API</Label><Input value={form.api_endpoint} onChange={(e) => setForm({ ...form, api_endpoint: e.target.value })} placeholder="https://..." /></div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
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
