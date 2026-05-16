import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Loader2, Package, Sparkles, Plus, Search } from "lucide-react";
import { toast } from "sonner";

export default function MerchantDropshipShopDetail() {
  const { id } = useParams();
  const [shop, setShop] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [catalog, setCatalog] = useState<any[]>([]);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [searching, setSearching] = useState("");
  const [importing, setImporting] = useState(false);

  const load = async () => {
    if (!id) return;
    setLoading(true);
    const [{ data: s }, { data: p }] = await Promise.all([
      supabase.from("dropship_shops" as any).select("*").eq("id", id).maybeSingle(),
      supabase.from("dropship_shop_products" as any).select("*").eq("shop_id", id).order("created_at", { ascending: false }),
    ]);
    setShop(s); setProducts((p as any) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [id]);

  const openPicker = async () => {
    setPickerOpen(true);
    const { data } = await supabase.from("supplier_products" as any)
      .select("id, title, wholesale_price, currency, images")
      .order("last_synced_at", { ascending: false })
      .limit(50);
    setCatalog((data as any) ?? []);
  };

  const searchCatalog = async () => {
    const q = searching.trim();
    if (!q) return openPicker();
    const { data } = await supabase.from("supplier_products" as any)
      .select("id, title, wholesale_price, currency, images")
      .ilike("title", `%${q}%`).limit(50);
    setCatalog((data as any) ?? []);
  };

  const togglePick = (pid: string) => {
    const n = new Set(picked);
    n.has(pid) ? n.delete(pid) : n.add(pid);
    setPicked(n);
  };

  const importPicked = async () => {
    if (picked.size === 0) { toast.error("Sélectionnez au moins un produit"); return; }
    setImporting(true);
    const { data, error } = await supabase.functions.invoke("import-to-dropship-shop", {
      body: { shop_id: id, supplier_product_ids: Array.from(picked) },
    });
    setImporting(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${(data as any).imported} produits importés`);
    setPickerOpen(false); setPicked(new Set());
    load();
  };

  const toggleStatus = async () => {
    if (!shop) return;
    const newStatus = shop.status === "active" ? "paused" : "active";
    await supabase.from("dropship_shops" as any).update({ status: newStatus }).eq("id", id);
    load();
  };

  const runAutopilot = async () => {
    const { data, error } = await supabase.functions.invoke("managed-shop-autopilot", { body: { shop_id: id, max_products: 20 } });
    if (error) { toast.error(error.message); return; }
    toast.success(`${(data as any).imported ?? 0} produits ajoutés par l'IA`);
    load();
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  if (!shop) return <div className="container py-10">Boutique introuvable</div>;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <Link to="/dropship/boutiques" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4 mr-1" />Mes boutiques
      </Link>

      <Card className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">{shop.name}</h1>
            <p className="text-sm text-muted-foreground">/{shop.slug} · {shop.currency} · marge {shop.default_margin_pct}%</p>
            <div className="flex gap-2 mt-2">
              <Badge variant={shop.status === "active" ? "default" : "secondary"}>{shop.status}</Badge>
              {shop.management_mode === "managed" && <Badge variant="outline">🤖 Gérée par Boardeal</Badge>}
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={toggleStatus}>{shop.status === "active" ? "Mettre en pause" : "Activer"}</Button>
            {shop.management_mode === "managed" && (
              <Button onClick={runAutopilot}><Sparkles className="h-4 w-4 mr-2" />Lancer autopilot</Button>
            )}
            <Button onClick={openPicker}><Plus className="h-4 w-4 mr-2" />Importer des produits</Button>
          </div>
        </div>
      </Card>

      <div>
        <h2 className="text-lg font-semibold mb-3">Produits ({products.length})</h2>
        {products.length === 0 ? (
          <Card className="p-10 text-center">
            <Package className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Aucun produit. Importez depuis le catalogue CJ.</p>
          </Card>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {products.map(p => (
              <Card key={p.id} className="p-4 space-y-2">
                {p.images?.[0] && <img src={p.images[0]} alt={p.title} className="w-full h-32 object-cover rounded" />}
                <div className="flex justify-between gap-2">
                  <h4 className="font-medium text-sm line-clamp-2 flex-1">{p.title}</h4>
                  {p.ai_generated && <Badge variant="outline" className="shrink-0">IA</Badge>}
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Coût {p.cost_price} {p.currency}</span>
                  <span className="font-semibold">{p.sale_price} {p.currency}</span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Dialog open={pickerOpen} onOpenChange={setPickerOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle>Catalogue CJ Dropshipping</DialogTitle></DialogHeader>
          <div className="flex gap-2">
            <Input placeholder="Rechercher..." value={searching} onChange={e => setSearching(e.target.value)} onKeyDown={e => e.key === "Enter" && searchCatalog()} />
            <Button variant="outline" onClick={searchCatalog}><Search className="h-4 w-4" /></Button>
          </div>
          <div className="flex-1 overflow-auto grid gap-2 sm:grid-cols-2">
            {catalog.map(p => (
              <Card key={p.id} className={`p-3 cursor-pointer ${picked.has(p.id) ? "ring-2 ring-primary" : ""}`} onClick={() => togglePick(p.id)}>
                <div className="flex gap-2">
                  <Checkbox checked={picked.has(p.id)} />
                  {p.images?.[0] && <img src={p.images[0]} alt="" className="w-16 h-16 object-cover rounded" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm line-clamp-2">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.wholesale_price} {p.currency}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <DialogFooter>
            <span className="text-sm text-muted-foreground mr-auto">{picked.size} sélectionné(s)</span>
            <Button variant="ghost" onClick={() => setPickerOpen(false)}>Annuler</Button>
            <Button onClick={importPicked} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : `Importer ${picked.size}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
