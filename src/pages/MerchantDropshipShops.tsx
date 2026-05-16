import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Sparkles, Plus, Store, Loader2, Bot } from "lucide-react";
import { toast } from "sonner";

interface Shop {
  id: string;
  name: string;
  slug: string;
  niche: string | null;
  status: string;
  management_mode: string;
  ai_autopilot_enabled: boolean;
  currency: string;
  default_margin_pct: number;
  managed_plan: string | null;
}

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export default function MerchantDropshipShops() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [autopilotBusy, setAutopilotBusy] = useState<string | null>(null);

  const [form, setForm] = useState({
    name: "",
    niche: "",
    description: "",
    currency: "CAD",
    management_mode: "self" as "self" | "managed",
    default_margin_pct: "40",
  });

  const load = async () => {
    setLoading(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setLoading(false); return; }
    const { data, error } = await supabase
      .from("dropship_shops" as any)
      .select("*")
      .eq("owner_user_id", u.user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error(error.message);
    setShops((data as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.name.trim()) { toast.error("Nom requis"); return; }
    setSaving(true);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) { setSaving(false); return; }
    const slug = `${slugify(form.name)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("dropship_shops" as any).insert({
      owner_user_id: u.user.id,
      name: form.name,
      slug,
      niche: form.niche || null,
      description: form.description || null,
      currency: form.currency,
      management_mode: form.management_mode,
      default_margin_pct: Number(form.default_margin_pct) || 40,
      managed_plan: form.management_mode === "managed" ? "managed_basic" : null,
      managed_started_at: form.management_mode === "managed" ? new Date().toISOString() : null,
      status: "draft",
    });
    setSaving(false);
    if (error) { toast.error(error.message); return; }
    toast.success("Boutique créée");
    setOpen(false);
    setForm({ name: "", niche: "", description: "", currency: "CAD", management_mode: "self", default_margin_pct: "40" });
    load();
  };

  const launchAutopilot = async (shopId: string) => {
    setAutopilotBusy(shopId);
    const { data, error } = await supabase.functions.invoke("managed-shop-autopilot", {
      body: { shop_id: shopId, max_products: 20 },
    });
    setAutopilotBusy(null);
    if (error) { toast.error(error.message); return; }
    toast.success(`Autopilot : ${(data as any).imported ?? 0} produits importés`);
    load();
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mes boutiques dropshipping</h1>
          <p className="text-sm text-muted-foreground">Créez une boutique, importez des produits CJ, ou laissez l'IA tout gérer.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/dropship/assistant"><Bot className="h-4 w-4 mr-2" />Assistant IA</Link>
          </Button>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-2" />Nouvelle boutique</Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>
      ) : shops.length === 0 ? (
        <Card className="p-10 text-center">
          <Store className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground mb-4">Vous n'avez pas encore de boutique.</p>
          <Button onClick={() => setOpen(true)}>Créer ma première boutique</Button>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map(s => (
            <Card key={s.id} className="p-5 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{s.name}</h3>
                  <p className="text-xs text-muted-foreground">/{s.slug}</p>
                </div>
                <Badge variant={s.status === "active" ? "default" : "secondary"}>{s.status}</Badge>
              </div>
              {s.niche && <p className="text-sm text-muted-foreground">{s.niche}</p>}
              <div className="flex flex-wrap gap-2 text-xs">
                <Badge variant="outline">{s.management_mode === "managed" ? "🤖 Gérée par Boardeal" : "Auto-gérée"}</Badge>
                <Badge variant="outline">Marge {s.default_margin_pct}%</Badge>
                {s.ai_autopilot_enabled && <Badge>Autopilot ON</Badge>}
              </div>
              <div className="flex gap-2 pt-2">
                <Button size="sm" variant="outline" asChild className="flex-1">
                  <Link to={`/dropship/boutique/${s.id}`}>Gérer</Link>
                </Button>
                {s.management_mode === "managed" && (
                  <Button size="sm" onClick={() => launchAutopilot(s.id)} disabled={autopilotBusy === s.id}>
                    {autopilotBusy === s.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Créer une boutique dropshipping</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Nom de la boutique</Label>
              <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: TrendStore" />
            </div>
            <div>
              <Label>Niche (catégorie principale)</Label>
              <Input value={form.niche} onChange={e => setForm({ ...form, niche: e.target.value })} placeholder="Ex: Beauté, Maison, Gadgets" />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Devise</Label>
                <Select value={form.currency} onValueChange={v => setForm({ ...form, currency: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Marge par défaut (%)</Label>
                <Input type="number" value={form.default_margin_pct} onChange={e => setForm({ ...form, default_margin_pct: e.target.value })} />
              </div>
            </div>
            <Card className="p-3 bg-muted/40">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="font-medium">Mode gestion déléguée 🤖</Label>
                  <p className="text-xs text-muted-foreground">Boardeal gère votre boutique de A à Z avec l'IA (plan payant).</p>
                </div>
                <Switch
                  checked={form.management_mode === "managed"}
                  onCheckedChange={c => setForm({ ...form, management_mode: c ? "managed" : "self" })}
                />
              </div>
            </Card>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
            <Button onClick={create} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
