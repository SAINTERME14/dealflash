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
import { Loader2, Plus, Pencil, Trash2, Truck, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";

type SupplierType = "cj_dropshipping" | "aliexpress" | "alibaba" | "generic_api" | "csv_import" | "manual";
type SupplierStatus = "active" | "paused" | "disabled";

interface Supplier {
  id: string;
  name: string;
  type: SupplierType;
  status: SupplierStatus;
  api_endpoint: string | null;
  contact_email: string | null;
  contact_url: string | null;
  default_lead_time_days: number | null;
  notes: string | null;
}

const typeLabels: Record<SupplierType, string> = {
  cj_dropshipping: "CJ Dropshipping",
  aliexpress: "AliExpress",
  alibaba: "Alibaba",
  generic_api: "API générique",
  csv_import: "Import CSV",
  manual: "Manuel",
};

export default function AdminSuppliers() {
  const [items, setItems] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [csvDialog, setCsvDialog] = useState<Supplier | null>(null);
  const [csvText, setCsvText] = useState("");

  const [form, setForm] = useState({
    name: "",
    type: "manual" as SupplierType,
    status: "active" as SupplierStatus,
    api_endpoint: "",
    contact_email: "",
    contact_url: "",
    default_lead_time_days: "7",
    notes: "",
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("suppliers").select("*").order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    else setItems((data ?? []) as Supplier[]);
    setLoading(false);
  };

  useEffect(() => {
    document.title = "Fournisseurs — Admin Boardeal";
    load();
  }, []);

  const resetForm = () => {
    setEditing(null);
    setForm({ name: "", type: "manual", status: "active", api_endpoint: "", contact_email: "", contact_url: "", default_lead_time_days: "7", notes: "" });
  };

  const openEdit = (s: Supplier) => {
    setEditing(s);
    setForm({
      name: s.name,
      type: s.type,
      status: s.status,
      api_endpoint: s.api_endpoint ?? "",
      contact_email: s.contact_email ?? "",
      contact_url: s.contact_url ?? "",
      default_lead_time_days: String(s.default_lead_time_days ?? 7),
      notes: s.notes ?? "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Nom requis");
      return;
    }
    const payload = {
      name: form.name.trim(),
      type: form.type,
      status: form.status,
      api_endpoint: form.api_endpoint.trim() || null,
      contact_email: form.contact_email.trim() || null,
      contact_url: form.contact_url.trim() || null,
      default_lead_time_days: parseInt(form.default_lead_time_days) || 7,
      notes: form.notes.trim() || null,
    };
    if (editing) {
      const { error } = await supabase.from("suppliers").update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("Fournisseur mis à jour");
    } else {
      const { error } = await supabase.from("suppliers").insert(payload);
      if (error) return toast.error(error.message);
      toast.success("Fournisseur ajouté");
    }
    setOpen(false);
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer ce fournisseur ?")) return;
    const { error } = await supabase.from("suppliers").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Supprimé"); load(); }
  };

  const syncApi = async (s: Supplier) => {
    setSyncingId(s.id);
    try {
      const { data, error } = await supabase.functions.invoke("sync-supplier-products", {
        body: { supplier_id: s.id, mode: "api" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${data.imported ?? 0} produits importés depuis ${s.name}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur de synchronisation");
    } finally {
      setSyncingId(null);
    }
  };

  const importCsv = async () => {
    if (!csvDialog || !csvText.trim()) return;
    setSyncingId(csvDialog.id);
    try {
      const { data, error } = await supabase.functions.invoke("sync-supplier-products", {
        body: { supplier_id: csvDialog.id, mode: "csv", csv: csvText },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`${data.imported ?? 0} produits importés`);
      setCsvDialog(null);
      setCsvText("");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Erreur d'import");
    } finally {
      setSyncingId(null);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Truck className="h-7 w-7" /> Fournisseurs dropshipping
            </h1>
            <p className="text-muted-foreground mt-1">
              CJ Dropshipping, AliExpress, Alibaba ou tout autre via API/CSV.
            </p>
          </div>
          <Button onClick={() => { resetForm(); setOpen(true); }} variant="hero">
            <Plus className="h-4 w-4" /> Nouveau fournisseur
          </Button>
        </div>

        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : items.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-muted-foreground">Aucun fournisseur configuré.</p>
          </Card>
        ) : (
          <div className="grid gap-3">
            {items.map((s) => (
              <Card key={s.id} className="p-4 flex justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
                    <Badge variant="outline">{typeLabels[s.type]}</Badge>
                  </div>
                  <h3 className="font-medium">{s.name}</h3>
                  {s.contact_email && <p className="text-xs text-muted-foreground">{s.contact_email}</p>}
                  {s.notes && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{s.notes}</p>}
                </div>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <Button onClick={() => setCsvDialog(s)} variant="outline" size="sm" title="Importer CSV">
                    <Upload className="h-3 w-3" />
                  </Button>
                  {(s.type === "generic_api" || s.type === "cj_dropshipping") && (
                    <Button onClick={() => syncApi(s)} variant="outline" size="sm" disabled={syncingId === s.id} title="Synchroniser API">
                      {syncingId === s.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    </Button>
                  )}
                  <Button onClick={() => openEdit(s)} variant="outline" size="sm"><Pencil className="h-3 w-3" /></Button>
                  <Button onClick={() => remove(s.id)} variant="ghost" size="sm" className="text-destructive"><Trash2 className="h-3 w-3" /></Button>
                </div>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{editing ? "Modifier" : "Nouveau fournisseur"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Nom *</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Type</Label>
                  <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v as SupplierType })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(typeLabels).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Statut</Label>
                  <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as SupplierStatus })}>
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
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Email contact</Label><Input type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
                <div><Label>URL contact</Label><Input value={form.contact_url} onChange={(e) => setForm({ ...form, contact_url: e.target.value })} /></div>
              </div>
              <div><Label>Délai livraison (jours)</Label><Input type="number" value={form.default_lead_time_days} onChange={(e) => setForm({ ...form, default_lead_time_days: e.target.value })} /></div>
              <div><Label>Notes</Label><Textarea rows={2} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
              <Button onClick={save} variant="hero">{editing ? "Enregistrer" : "Créer"}</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={!!csvDialog} onOpenChange={(v) => { if (!v) { setCsvDialog(null); setCsvText(""); } }}>
          <DialogContent className="max-w-2xl">
            <DialogHeader><DialogTitle>Importer un CSV — {csvDialog?.name}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Colonnes attendues : <code>sku, title, price, description, currency, stock, image_url, source_url</code>
              </p>
              <Textarea
                rows={10}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="sku,title,price,stock&#10;ABC-001,Produit exemple,12.99,100"
                className="font-mono text-xs"
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setCsvDialog(null); setCsvText(""); }}>Annuler</Button>
              <Button onClick={importCsv} variant="hero" disabled={syncingId === csvDialog?.id || !csvText.trim()}>
                {syncingId === csvDialog?.id && <Loader2 className="h-3 w-3 animate-spin mr-1" />}
                Importer
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
