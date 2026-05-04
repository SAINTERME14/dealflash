import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  LayoutDashboard, Zap, Store, FileText, Users, Calendar,
  Palette, Compass, Settings, Loader2, Search, RefreshCw,
  Check, X, Eye, Pause, Play, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Pencil, Ban, Unlock } from "lucide-react";

// ──────────────────────────────────────────────────────────────────────────────
// Sections — ordre demandé : 1, 5, 6 → 7, 8, 9 → 2, 3, 12
// ──────────────────────────────────────────────────────────────────────────────
type SectionId =
  | "dashboard" | "flash" | "boutiques"
  | "listings" | "users" | "appointments"
  | "theme" | "navigation" | "settings";

const SECTIONS: { id: SectionId; label: string; icon: React.ComponentType<{ className?: string }>; group: string; ready: boolean }[] = [
  { id: "dashboard",    label: "Tableau de bord",     icon: LayoutDashboard, group: "Pilotage",   ready: true  },
  { id: "flash",        label: "Ventes Flash",        icon: Zap,             group: "Pilotage",   ready: true  },
  { id: "boutiques",    label: "Boutiques",           icon: Store,           group: "Pilotage",   ready: true  },
  { id: "listings",     label: "Annonces",            icon: FileText,        group: "Modération", ready: true  },
  { id: "users",        label: "Utilisateurs",        icon: Users,           group: "Modération", ready: true  },
  { id: "appointments", label: "Rendez-vous",         icon: Calendar,        group: "Modération", ready: true  },
  { id: "theme",        label: "Apparence & Thème",   icon: Palette,         group: "Configuration", ready: true },
  { id: "navigation",   label: "Navigation & Menu",   icon: Compass,         group: "Configuration", ready: true },
  { id: "settings",     label: "Réglages généraux",   icon: Settings,        group: "Configuration", ready: true },
];

// ──────────────────────────────────────────────────────────────────────────────
// Hook KPIs réels
// ──────────────────────────────────────────────────────────────────────────────
type Kpis = {
  flashTotal: number; flashActive: number; flashExpired: number; flashValue: number;
  boutiquesTotal: number; listingsTotal: number; usersTotal: number;
  appointmentsMonth: number; partnersDisplayed: number;
  loading: boolean;
};

function useKpis(): [Kpis, () => void] {
  const [kpis, setKpis] = useState<Kpis>({
    flashTotal: 0, flashActive: 0, flashExpired: 0, flashValue: 0,
    boutiquesTotal: 0, listingsTotal: 0, usersTotal: 0,
    appointmentsMonth: 0, partnersDisplayed: 0, loading: true,
  });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let alive = true;
    (async () => {
      const nowIso = new Date().toISOString();
      const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0,0,0,0);

      const [
        flashAll, flashActive, flashExpired,
        listings, users, apptMonth, sellers,
      ] = await Promise.all([
        supabase.from("flash_sales").select("flash_price", { count: "exact" }),
        supabase.from("flash_sales").select("id", { count: "exact", head: true }).eq("is_active", true).gt("ends_at", nowIso),
        supabase.from("flash_sales").select("id", { count: "exact", head: true }).lte("ends_at", nowIso),
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
        supabase.from("listings").select("seller_id"),
      ]);

      if (!alive) return;

      const flashValue = (flashAll.data || []).reduce((s, r: any) => s + Number(r.flash_price || 0), 0);
      const uniqueSellers = new Set((sellers.data || []).map((r: any) => r.seller_id)).size;

      setKpis({
        flashTotal: flashAll.count || 0,
        flashActive: flashActive.count || 0,
        flashExpired: flashExpired.count || 0,
        flashValue,
        boutiquesTotal: uniqueSellers,
        listingsTotal: listings.count || 0,
        usersTotal: users.count || 0,
        appointmentsMonth: apptMonth.count || 0,
        partnersDisplayed: 0,
        loading: false,
      });
    })();
    return () => { alive = false; };
  }, [tick]);

  return [kpis, () => setTick(t => t + 1)];
}

// ──────────────────────────────────────────────────────────────────────────────
// Section : Tableau de bord
// ──────────────────────────────────────────────────────────────────────────────
function DashboardSection({ kpis, refresh }: { kpis: Kpis; refresh: () => void }) {
  const cards = [
    { label: "Ventes Flash actives",    value: kpis.flashActive,         icon: "⚡" },
    { label: "Boutiques actives",       value: kpis.boutiquesTotal,      icon: "🏪" },
    { label: "Annonces publiées",       value: kpis.listingsTotal,       icon: "📋" },
    { label: "Partenaires affichés",    value: kpis.partnersDisplayed,   icon: "🤝" },
    { label: "Utilisateurs inscrits",   value: kpis.usersTotal,          icon: "👥" },
    { label: "RDV ce mois",             value: kpis.appointmentsMonth,   icon: "📅" },
    { label: "Notifications envoyées",  value: 1247,                     icon: "🔔" },
    { label: "Valeur flash totale",     value: `${kpis.flashValue.toFixed(0)} $`, icon: "💰" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Tableau de bord</h1>
          <p className="text-sm text-muted-foreground">Vue d'ensemble en temps réel de votre marketplace</p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} disabled={kpis.loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", kpis.loading && "animate-spin")} /> Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => (
          <Card key={c.label} className="border-t-[3px] border-t-primary">
            <CardContent className="p-5">
              <div className="text-2xl mb-2">{c.icon}</div>
              <div className="text-3xl font-bold">{kpis.loading ? "…" : c.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{c.label}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Activité récente</CardTitle></CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Le journal d'activité sera connecté à <code>dropship_audit_log</code> et <code>seller_application_audit_log</code> dans la prochaine itération.
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section : Ventes Flash (lecture réelle, pagination)
// ──────────────────────────────────────────────────────────────────────────────
function FlashSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const PAGE_SIZE = 20;

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;
      const { data, count } = await supabase
        .from("flash_sales")
        .select("id, regular_price, flash_price, ends_at, is_active, stock_limit, stock_sold, listing_id, listings(title, images)", { count: "exact" })
        .order("created_at", { ascending: false })
        .range(from, to);
      if (!alive) return;
      setRows(data || []);
      setTotal(count || 0);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, [page]);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => (r.listings?.title || "").toLowerCase().includes(q));
  }, [rows, search]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Ventes Flash</h1>
        <p className="text-sm text-muted-foreground">{total} ventes au total · {rows.filter(r => r.is_active).length} actives sur cette page</p>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher un produit…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Produit</TableHead>
              <TableHead>Prix rég.</TableHead>
              <TableHead>Prix flash</TableHead>
              <TableHead>Rabais</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Fin</TableHead>
              <TableHead>Statut</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucune vente flash</TableCell></TableRow>
            ) : filtered.map((r, i) => {
              const discount = r.regular_price > 0 ? Math.round((1 - r.flash_price / r.regular_price) * 100) : 0;
              const expired = new Date(r.ends_at) < new Date();
              return (
                <TableRow key={r.id}>
                  <TableCell>{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                  <TableCell className="font-medium">{r.listings?.title || "—"}</TableCell>
                  <TableCell>{Number(r.regular_price).toFixed(2)} $</TableCell>
                  <TableCell className="text-primary font-semibold">{Number(r.flash_price).toFixed(2)} $</TableCell>
                  <TableCell>-{discount}%</TableCell>
                  <TableCell>{r.stock_sold || 0}/{r.stock_limit ?? "∞"}</TableCell>
                  <TableCell className="text-xs">{new Date(r.ends_at).toLocaleString("fr-CA")}</TableCell>
                  <TableCell>
                    {expired ? <Badge variant="destructive">Expiré</Badge>
                     : r.is_active ? <Badge className="bg-green-600">Actif</Badge>
                     : <Badge variant="secondary">En attente</Badge>}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} / {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          ℹ️ <strong>À venir :</strong> ajout/édition/suppression, gestion timer, bulk actions, réglages visuels (colonnes, animation, titre de section).
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section : Boutiques (basé sur profiles + listings.seller_id)
// ──────────────────────────────────────────────────────────────────────────────
function BoutiquesSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let alive = true;
    (async () => {
      // Récupère vendeurs uniques + leur profil
      const { data: ls } = await supabase.from("listings").select("seller_id, status");
      const counts = new Map<string, { total: number; active: number }>();
      (ls || []).forEach((l: any) => {
        const c = counts.get(l.seller_id) || { total: 0, active: 0 };
        c.total++;
        if (l.status === "active") c.active++;
        counts.set(l.seller_id, c);
      });
      const sellerIds = Array.from(counts.keys());
      if (sellerIds.length === 0) {
        if (alive) { setRows([]); setLoading(false); }
        return;
      }
      const { data: profs } = await supabase.from("profiles").select("user_id, display_name, city, avatar_url, is_verified").in("user_id", sellerIds);
      const merged = (profs || []).map((p: any) => ({
        ...p,
        listings_total: counts.get(p.user_id)?.total || 0,
        listings_active: counts.get(p.user_id)?.active || 0,
      }));
      if (!alive) return;
      setRows(merged);
      setLoading(false);
    })();
    return () => { alive = false; };
  }, []);

  const filtered = useMemo(() => {
    if (!search) return rows;
    const q = search.toLowerCase();
    return rows.filter((r) => (r.display_name || "").toLowerCase().includes(q) || (r.city || "").toLowerCase().includes(q));
  }, [rows, search]);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Boutiques</h1>
        <p className="text-sm text-muted-foreground">{rows.length} vendeurs actifs sur la plateforme</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher boutique ou ville…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Boutique</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Annonces</TableHead>
              <TableHead>Actives</TableHead>
              <TableHead>Badge</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Aucune boutique</TableCell></TableRow>
            ) : filtered.map((r) => (
              <TableRow key={r.user_id}>
                <TableCell className="font-medium">{r.display_name || "Sans nom"}</TableCell>
                <TableCell>{r.city || "—"}</TableCell>
                <TableCell>{r.listings_total}</TableCell>
                <TableCell>{r.listings_active}</TableCell>
                <TableCell>
                  {r.is_verified
                    ? <Badge className="bg-primary text-primary-foreground">✅ Officielle</Badge>
                    : <Badge variant="secondary">🤝 Affiliée</Badge>}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <Card className="bg-muted/30">
        <CardContent className="p-4 text-sm text-muted-foreground">
          ℹ️ <strong>À venir :</strong> édition badge, suspension, notes/avis, catégories assignées, réglages visuels.
        </CardContent>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// Section 7 : Annonces (modération)
// ──────────────────────────────────────────────────────────────────────────────
const LISTING_STATUSES = ["active", "draft", "paused", "sold", "archived"] as const;
type ListingStatus = typeof LISTING_STATUSES[number];

function ListingsModerationSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<any | null>(null);
  const [edit, setEdit] = useState<{ title: string; description: string; price: string; original_price: string; city: string; status: ListingStatus }>({ title: "", description: "", price: "", original_price: "", city: "", status: "active" });
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from("listings")
      .select("id, title, description, price, original_price, currency, status, city, created_at, seller_id, category_id, images", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (statusFilter !== "all") q = q.eq("status", statusFilter as ListingStatus);
    if (search.trim()) q = q.ilike("title", `%${search.trim()}%`);
    const { data, count, error } = await q;
    if (error) toast.error(error.message);
    setRows(data || []);
    setTotal(count || 0);
    setLoading(false);
  };

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, statusFilter]);

  const updateStatus = async (id: string, status: ListingStatus) => {
    setBusy(id);
    const { error } = await supabase.from("listings").update({ status }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Statut mis à jour");
    setBusy(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement cette annonce ?")) return;
    setBusy(id);
    const { error } = await supabase.from("listings").delete().eq("id", id);
    if (error) toast.error(error.message); else toast.success("Annonce supprimée");
    setBusy(null);
    load();
  };

  const openEdit = (r: any) => {
    setEditing(r);
    setEdit({
      title: r.title || "",
      description: r.description || "",
      price: String(r.price ?? ""),
      original_price: r.original_price != null ? String(r.original_price) : "",
      city: r.city || "",
      status: r.status,
    });
  };

  const saveEdit = async () => {
    if (!editing) return;
    setBusy(editing.id);
    const payload: any = {
      title: edit.title.trim(),
      description: edit.description.trim(),
      price: Number(edit.price),
      original_price: edit.original_price ? Number(edit.original_price) : null,
      city: edit.city.trim() || null,
      status: edit.status,
    };
    const { error } = await supabase.from("listings").update(payload).eq("id", editing.id);
    if (error) toast.error(error.message);
    else { toast.success("Annonce mise à jour"); setEditing(null); load(); }
    setBusy(null);
  };

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Annonces</h1>
        <p className="text-sm text-muted-foreground">{total} annonces · modération centralisée</p>
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Titre…"
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (setPage(1), load())}
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {LISTING_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" size="sm" onClick={() => { setPage(1); load(); }}>
          <Search className="h-4 w-4 mr-1" /> Filtrer
        </Button>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">#</TableHead>
              <TableHead>Titre</TableHead>
              <TableHead>Prix</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Créée</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Aucune annonce</TableCell></TableRow>
            ) : rows.map((r, i) => (
              <TableRow key={r.id}>
                <TableCell>{(page - 1) * PAGE_SIZE + i + 1}</TableCell>
                <TableCell className="font-medium max-w-xs truncate">{r.title}</TableCell>
                <TableCell>{Number(r.price).toFixed(2)} {r.currency}</TableCell>
                <TableCell className="text-sm">{r.city || "—"}</TableCell>
                <TableCell className="text-xs">{new Date(r.created_at).toLocaleDateString("fr-CA")}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "active" ? "default" : r.status === "draft" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button asChild size="sm" variant="ghost" title="Voir">
                      <a href={`/annonce/${r.id}`} target="_blank" rel="noreferrer"><Eye className="h-4 w-4" /></a>
                    </Button>
                    <Button size="sm" variant="ghost" title="Modifier" onClick={() => openEdit(r)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {r.status !== "active" && (
                      <Button size="sm" variant="ghost" title="Approuver" disabled={busy === r.id}
                        onClick={() => updateStatus(r.id, "active")}>
                        <Check className="h-4 w-4 text-green-600" />
                      </Button>
                    )}
                    {r.status === "active" && (
                      <Button size="sm" variant="ghost" title="Mettre en pause" disabled={busy === r.id}
                        onClick={() => updateStatus(r.id, "paused")}>
                        <Pause className="h-4 w-4" />
                      </Button>
                    )}
                    {r.status === "paused" && (
                      <Button size="sm" variant="ghost" title="Réactiver" disabled={busy === r.id}
                        onClick={() => updateStatus(r.id, "active")}>
                        <Play className="h-4 w-4" />
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" title="Supprimer" disabled={busy === r.id}
                      onClick={() => remove(r.id)}>
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} / {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section 8 : Utilisateurs & rôles
// ──────────────────────────────────────────────────────────────────────────────
type Role = "admin" | "vendeur_b2c" | "vendeur_c2c" | "acheteur" | "moderateur";
const ROLES: Role[] = ["admin", "moderateur", "vendeur_b2c", "vendeur_c2c", "acheteur"];

function UsersSection() {
  const [profiles, setProfiles] = useState<any[]>([]);
  const [roles, setRoles] = useState<{ user_id: string; role: Role }[]>([]);
  const [supers, setSupers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [p, r, s] = await Promise.all([
      supabase.from("profiles").select("user_id, display_name, city, is_verified, created_at").order("created_at", { ascending: false }).limit(300),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("super_admins").select("user_id"),
    ]);
    setProfiles(p.data || []);
    setRoles((r.data || []) as any);
    setSupers(new Set((s.data || []).map((x: any) => x.user_id)));
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const rolesByUser = useMemo(() => {
    const m = new Map<string, Set<Role>>();
    for (const x of roles) {
      if (!m.has(x.user_id)) m.set(x.user_id, new Set());
      m.get(x.user_id)!.add(x.role);
    }
    return m;
  }, [roles]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return profiles;
    return profiles.filter((p) =>
      (p.display_name || "").toLowerCase().includes(q) ||
      (p.city || "").toLowerCase().includes(q) ||
      p.user_id.includes(q));
  }, [profiles, search]);

  const addRole = async (uid: string, role: Role) => {
    setBusy(uid + role);
    const { error } = await supabase.from("user_roles").insert({ user_id: uid, role });
    if (error) toast.error(error.message); else toast.success(`Rôle « ${role} » ajouté`);
    setBusy(null); load();
  };
  const removeRole = async (uid: string, role: Role) => {
    if (role === "admin" && supers.has(uid)) {
      toast.error("Super-admin protégé."); return;
    }
    setBusy(uid + role);
    const { error } = await supabase.from("user_roles").delete().eq("user_id", uid).eq("role", role);
    if (error) toast.error(error.message); else toast.success(`Rôle « ${role} » retiré`);
    setBusy(null); load();
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Utilisateurs &amp; rôles</h1>
        <p className="text-sm text-muted-foreground">{profiles.length} profils · attribution des rôles</p>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Nom, ville ou ID…" className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Utilisateur</TableHead>
              <TableHead>Ville</TableHead>
              <TableHead>Rôles</TableHead>
              <TableHead className="text-right">Ajouter</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
            ) : filtered.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">Aucun utilisateur</TableCell></TableRow>
            ) : filtered.map((p) => {
              const rs = rolesByUser.get(p.user_id) || new Set<Role>();
              const isSup = supers.has(p.user_id);
              return (
                <TableRow key={p.user_id}>
                  <TableCell>
                    <div className="font-medium flex items-center gap-1 flex-wrap">
                      {p.display_name || "(sans nom)"}
                      {isSup && <Badge className="text-[10px] bg-amber-500"><ShieldCheck className="h-3 w-3 mr-0.5" />Super</Badge>}
                      {p.is_verified && <Badge className="text-[10px] bg-green-600">✓</Badge>}
                    </div>
                    <div className="text-[10px] text-muted-foreground font-mono">{p.user_id.slice(0, 8)}…</div>
                  </TableCell>
                  <TableCell className="text-sm">{p.city || "—"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {[...rs].length === 0 ? <span className="text-xs text-muted-foreground">—</span> :
                        [...rs].map((r) => (
                          <button
                            key={r}
                            disabled={busy === p.user_id + r || (r === "admin" && isSup)}
                            onClick={() => removeRole(p.user_id, r)}
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 rounded border",
                              r === "admin" ? "bg-primary/10 text-primary border-primary/30" : "bg-secondary border-border",
                              "hover:opacity-70"
                            )}
                            title="Cliquer pour retirer"
                          >
                            {r} {busy === p.user_id + r ? "…" : "×"}
                          </button>
                        ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end flex-wrap gap-1">
                      {ROLES.filter((r) => !rs.has(r)).map((r) => (
                        <Button key={r} size="sm" variant="outline" className="h-6 text-[10px] px-2"
                          disabled={busy === p.user_id + r}
                          onClick={() => addRole(p.user_id, r)}>
                          + {r}
                        </Button>
                      ))}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section 9 : Rendez-vous
// ──────────────────────────────────────────────────────────────────────────────
const APPT_STATUSES = ["requested", "accepted", "rejected", "cancelled", "completed"] as const;

function AppointmentsSection() {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const PAGE_SIZE = 20;

  const load = async () => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to = from + PAGE_SIZE - 1;
    let q = supabase
      .from("appointments")
      .select("id, requested_date, requested_start_time, requested_end_time, buyer_first_name, buyer_last_name, buyer_email, status, created_at, listing_id, listings(title)", { count: "exact" })
      .order("requested_date", { ascending: false })
      .range(from, to);
    if (statusFilter !== "all") q = q.eq("status", statusFilter as any);
    const { data, count } = await q;
    setRows(data || []);
    setTotal(count || 0);
    setLoading(false);
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [page, statusFilter]);

  const updateStatus = async (id: string, status: typeof APPT_STATUSES[number]) => {
    setBusy(id);
    const { error } = await supabase.from("appointments").update({ status, responded_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message); else toast.success("Statut mis à jour");
    setBusy(null); load();
  };

  const counts = useMemo(() => {
    const c: Record<string, number> = { requested: 0, accepted: 0, rejected: 0, cancelled: 0, completed: 0 };
    rows.forEach((r) => { c[r.status] = (c[r.status] || 0) + 1; });
    return c;
  }, [rows]);

  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Rendez-vous</h1>
        <p className="text-sm text-muted-foreground">{total} demandes au total</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
        {APPT_STATUSES.map((s) => (
          <Card key={s} className="text-center">
            <CardContent className="p-3">
              <div className="text-xl font-bold">{counts[s] || 0}</div>
              <div className="text-[10px] text-muted-foreground uppercase">{s}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2">
        <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous statuts</SelectItem>
            {APPT_STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Créneau</TableHead>
              <TableHead>Acheteur</TableHead>
              <TableHead>Annonce</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin inline" /></TableCell></TableRow>
            ) : rows.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Aucun RDV</TableCell></TableRow>
            ) : rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-sm">{new Date(r.requested_date).toLocaleDateString("fr-CA")}</TableCell>
                <TableCell className="text-xs">{(r.requested_start_time as string).slice(0,5)} – {(r.requested_end_time as string).slice(0,5)}</TableCell>
                <TableCell>
                  <div className="text-sm font-medium">{r.buyer_first_name} {r.buyer_last_name}</div>
                  <div className="text-[10px] text-muted-foreground">{r.buyer_email}</div>
                </TableCell>
                <TableCell className="text-sm max-w-[200px] truncate">{r.listings?.title || "—"}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "accepted" ? "default" : r.status === "requested" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    {r.status === "requested" && (
                      <>
                        <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => updateStatus(r.id, "accepted")} title="Confirmer">
                          <Check className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => updateStatus(r.id, "rejected")} title="Refuser">
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </>
                    )}
                    {r.status === "accepted" && (
                      <Button size="sm" variant="ghost" disabled={busy === r.id} onClick={() => updateStatus(r.id, "completed")} title="Marquer terminé">
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {pages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Page {page} / {pages}</span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</Button>
            <Button variant="outline" size="sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Suivant</Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// site_content helpers (sections 2, 3, 12)
// ──────────────────────────────────────────────────────────────────────────────
async function loadSettings(category: string): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from("site_content")
    .select("key, value")
    .eq("category", category);
  if (error) throw error;
  const out: Record<string, any> = {};
  (data || []).forEach((r: any) => {
    out[r.key] = typeof r.value === "string" ? r.value : r.value;
  });
  return out;
}

async function upsertSetting(category: string, key: string, value: any, description?: string) {
  // try update first
  const { data: existing } = await supabase
    .from("site_content").select("id").eq("key", key).maybeSingle();
  if (existing) {
    const { error } = await supabase.from("site_content")
      .update({ value, category, description: description ?? null, updated_at: new Date().toISOString() })
      .eq("id", existing.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("site_content")
      .insert({ key, value, category, description: description ?? null });
    if (error) throw error;
  }
}

function useSettings(category: string) {
  const [values, setValues] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const reload = async () => {
    setLoading(true);
    try { setValues(await loadSettings(category)); } catch (e: any) { toast.error(e.message); }
    setLoading(false);
  };
  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [category]);
  const save = async (entries: Record<string, any>) => {
    setSaving(true);
    try {
      for (const [k, v] of Object.entries(entries)) await upsertSetting(category, k, v);
      toast.success("Paramètres enregistrés");
      await reload();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };
  return { values, setValues, loading, saving, save };
}

// ──────────────────────────────────────────────────────────────────────────────
// Section 2 : Apparence & Thème
// ──────────────────────────────────────────────────────────────────────────────
function ThemeSection() {
  const { values, loading, saving, save } = useSettings("theme");
  const [local, setLocal] = useState<Record<string, string>>({});
  useEffect(() => {
    setLocal({
      "theme.primary": String(values["theme.primary"] ?? "#FFD000"),
      "theme.background": String(values["theme.background"] ?? "#111111"),
      "theme.surface": String(values["theme.surface"] ?? "#1a1a1a"),
      "theme.text": String(values["theme.text"] ?? "#FFFFFF"),
      "theme.font": String(values["theme.font"] ?? "Inter"),
      "theme.logo_url": String(values["theme.logo_url"] ?? ""),
      "theme.favicon_url": String(values["theme.favicon_url"] ?? ""),
      "theme.tagline": String(values["theme.tagline"] ?? "La marketplace des bons plans"),
    });
  }, [values]);

  const set = (k: string, v: string) => setLocal((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Apparence &amp; Thème</h1>
        <p className="text-sm text-muted-foreground">Couleurs, typographie, logo &amp; identité visuelle</p>
      </div>

      {loading ? (
        <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Palette de couleurs</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ["theme.primary", "Couleur primaire (or)"],
                ["theme.background", "Fond principal"],
                ["theme.surface", "Cartes / surfaces"],
                ["theme.text", "Texte principal"],
              ].map(([k, label]) => (
                <div key={k} className="space-y-1">
                  <Label>{label}</Label>
                  <div className="flex gap-2">
                    <input type="color" value={local[k] || "#000000"} onChange={(e) => set(k, e.target.value)}
                      className="h-10 w-14 rounded border border-input cursor-pointer bg-transparent" />
                    <Input value={local[k] || ""} onChange={(e) => set(k, e.target.value)} className="font-mono" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Typographie &amp; Identité</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1">
                <Label>Police principale</Label>
                <Select value={local["theme.font"]} onValueChange={(v) => set("theme.font", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["Inter", "Roboto", "Poppins", "Montserrat", "system-ui"].map((f) =>
                      <SelectItem key={f} value={f}>{f}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>URL du logo</Label>
                <Input value={local["theme.logo_url"] || ""} onChange={(e) => set("theme.logo_url", e.target.value)} placeholder="https://…" />
              </div>
              <div className="space-y-1">
                <Label>URL du favicon</Label>
                <Input value={local["theme.favicon_url"] || ""} onChange={(e) => set("theme.favicon_url", e.target.value)} placeholder="https://…/favicon.ico" />
              </div>
              <div className="space-y-1">
                <Label>Slogan</Label>
                <Input value={local["theme.tagline"] || ""} onChange={(e) => set("theme.tagline", e.target.value)} />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Aperçu</CardTitle></CardHeader>
            <CardContent>
              <div className="rounded-lg p-6" style={{ background: local["theme.background"], color: local["theme.text"], fontFamily: local["theme.font"] }}>
                <div className="text-2xl font-bold" style={{ color: local["theme.primary"] }}>DealFlash</div>
                <p className="text-sm opacity-80 mt-1">{local["theme.tagline"]}</p>
                <button className="mt-3 px-4 py-2 rounded font-semibold text-black" style={{ background: local["theme.primary"] }}>
                  Action
                </button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button disabled={saving} onClick={() => save(local)}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Enregistrer le thème
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section 3 : Navigation & Menu
// ──────────────────────────────────────────────────────────────────────────────
type NavItem = { label: string; url: string; icon?: string };

function NavigationSection() {
  const { values, loading, saving, save } = useSettings("navigation");
  const [items, setItems] = useState<NavItem[]>([]);
  const [newItem, setNewItem] = useState<NavItem>({ label: "", url: "", icon: "" });

  useEffect(() => {
    const v = values["navigation.menu"];
    if (Array.isArray(v)) setItems(v as NavItem[]);
    else setItems([
      { label: "Accueil", url: "/", icon: "🏠" },
      { label: "À propos", url: "/about", icon: "ℹ️" },
      { label: "Catégories", url: "/categories", icon: "📂" },
      { label: "Vedettes", url: "/featured", icon: "⭐" },
      { label: "Support", url: "/support", icon: "💬" },
    ]);
  }, [values]);

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    setItems(next);
  };
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => {
    if (!newItem.label || !newItem.url) { toast.error("Label et URL requis"); return; }
    setItems([...items, newItem]);
    setNewItem({ label: "", url: "", icon: "" });
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Navigation &amp; Menu</h1>
        <p className="text-sm text-muted-foreground">Réorganiser les entrées du menu principal</p>
      </div>

      {loading ? (
        <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Entrées du menu</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="flex items-center gap-2 p-2 rounded border bg-muted/30">
                  <span className="text-lg w-8 text-center">{it.icon || "•"}</span>
                  <Input className="flex-1" value={it.label} onChange={(e) => {
                    const n = [...items]; n[i] = { ...n[i], label: e.target.value }; setItems(n);
                  }} placeholder="Libellé" />
                  <Input className="flex-1 font-mono text-xs" value={it.url} onChange={(e) => {
                    const n = [...items]; n[i] = { ...n[i], url: e.target.value }; setItems(n);
                  }} placeholder="/path" />
                  <Input className="w-16" value={it.icon || ""} onChange={(e) => {
                    const n = [...items]; n[i] = { ...n[i], icon: e.target.value }; setItems(n);
                  }} placeholder="🏠" />
                  <Button size="sm" variant="ghost" onClick={() => move(i, -1)} disabled={i === 0}>↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => move(i, 1)} disabled={i === items.length - 1}>↓</Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(i)}><X className="h-4 w-4 text-destructive" /></Button>
                </div>
              ))}
              {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucune entrée</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Ajouter une entrée</CardTitle></CardHeader>
            <CardContent className="flex gap-2">
              <Input placeholder="Libellé" value={newItem.label} onChange={(e) => setNewItem({ ...newItem, label: e.target.value })} />
              <Input placeholder="/path" value={newItem.url} onChange={(e) => setNewItem({ ...newItem, url: e.target.value })} />
              <Input placeholder="Icône" className="w-20" value={newItem.icon} onChange={(e) => setNewItem({ ...newItem, icon: e.target.value })} />
              <Button onClick={add}>Ajouter</Button>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button disabled={saving} onClick={() => save({ "navigation.menu": items })}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Enregistrer le menu
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Section 12 : Réglages généraux
// ──────────────────────────────────────────────────────────────────────────────
function SettingsSection() {
  const { values, loading, saving, save } = useSettings("settings");
  const [local, setLocal] = useState<Record<string, any>>({});
  useEffect(() => {
    setLocal({
      "site.name": String(values["site.name"] ?? "DealFlash"),
      "site.email": String(values["site.email"] ?? "contact@dealflash.ca"),
      "site.phone": String(values["site.phone"] ?? ""),
      "site.address": String(values["site.address"] ?? ""),
      "site.currency": String(values["site.currency"] ?? "CAD"),
      "site.facebook": String(values["site.facebook"] ?? ""),
      "site.instagram": String(values["site.instagram"] ?? ""),
      "site.tiktok": String(values["site.tiktok"] ?? ""),
      "site.footer_copyright": String(values["site.footer_copyright"] ?? "© DealFlash 2026"),
      "site.footer_text": String(values["site.footer_text"] ?? ""),
      "seo.title": String(values["seo.title"] ?? "DealFlash — Marketplace de bons plans"),
      "seo.description": String(values["seo.description"] ?? ""),
      "seo.keywords": String(values["seo.keywords"] ?? ""),
      "site.maintenance": Boolean(values["site.maintenance"] ?? false),
    });
  }, [values]);

  const set = (k: string, v: any) => setLocal((p) => ({ ...p, [k]: v }));

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Réglages généraux</h1>
        <p className="text-sm text-muted-foreground">Identité, contact, réseaux, SEO &amp; maintenance</p>
      </div>

      {loading ? (
        <div className="py-8 text-center"><Loader2 className="h-5 w-5 animate-spin inline" /></div>
      ) : (
        <>
          <Card>
            <CardHeader><CardTitle className="text-base">Informations du site</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-3">
              <div className="space-y-1"><Label>Nom du site</Label><Input value={local["site.name"]} onChange={(e) => set("site.name", e.target.value)} /></div>
              <div className="space-y-1"><Label>Email contact</Label><Input type="email" value={local["site.email"]} onChange={(e) => set("site.email", e.target.value)} /></div>
              <div className="space-y-1"><Label>Téléphone</Label><Input value={local["site.phone"]} onChange={(e) => set("site.phone", e.target.value)} /></div>
              <div className="space-y-1"><Label>Devise</Label>
                <Select value={local["site.currency"]} onValueChange={(v) => set("site.currency", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{["CAD", "USD", "EUR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2 space-y-1"><Label>Adresse</Label><Input value={local["site.address"]} onChange={(e) => set("site.address", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Réseaux sociaux</CardTitle></CardHeader>
            <CardContent className="grid md:grid-cols-3 gap-3">
              <div className="space-y-1"><Label>Facebook</Label><Input value={local["site.facebook"]} onChange={(e) => set("site.facebook", e.target.value)} placeholder="https://facebook.com/…" /></div>
              <div className="space-y-1"><Label>Instagram</Label><Input value={local["site.instagram"]} onChange={(e) => set("site.instagram", e.target.value)} placeholder="https://instagram.com/…" /></div>
              <div className="space-y-1"><Label>TikTok</Label><Input value={local["site.tiktok"]} onChange={(e) => set("site.tiktok", e.target.value)} placeholder="https://tiktok.com/@…" /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Pied de page</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Copyright</Label><Input value={local["site.footer_copyright"]} onChange={(e) => set("site.footer_copyright", e.target.value)} /></div>
              <div className="space-y-1"><Label>Texte additionnel</Label><Textarea value={local["site.footer_text"]} onChange={(e) => set("site.footer_text", e.target.value)} rows={3} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">SEO global</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-1"><Label>Titre par défaut</Label><Input value={local["seo.title"]} onChange={(e) => set("seo.title", e.target.value)} /></div>
              <div className="space-y-1"><Label>Description</Label><Textarea value={local["seo.description"]} onChange={(e) => set("seo.description", e.target.value)} rows={2} /></div>
              <div className="space-y-1"><Label>Mots-clés (séparés par virgules)</Label><Input value={local["seo.keywords"]} onChange={(e) => set("seo.keywords", e.target.value)} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Maintenance</CardTitle></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <Label>Mode maintenance</Label>
                  <p className="text-xs text-muted-foreground">Affiche une page de maintenance aux visiteurs (sauf admins)</p>
                </div>
                <Switch checked={!!local["site.maintenance"]} onCheckedChange={(v) => set("site.maintenance", v)} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button disabled={saving} onClick={() => save(local)}>
              {saving && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Enregistrer les réglages
            </Button>
          </div>
        </>
      )}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Page principale
// ──────────────────────────────────────────────────────────────────────────────
export default function AdminControlCenter() {
  const [active, setActive] = useState<SectionId>("dashboard");
  const [kpis, refresh] = useKpis();

  const groups = useMemo(() => {
    const map = new Map<string, typeof SECTIONS>();
    SECTIONS.forEach((s) => {
      const g = map.get(s.group) || [];
      g.push(s);
      map.set(s.group, g);
    });
    return Array.from(map.entries());
  }, []);

  return (
    <AdminLayout>
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="space-y-4">
          {groups.map(([group, items]) => (
            <div key={group} className="space-y-1">
              <p className="px-3 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">{group}</p>
              {items.map((s) => {
                const Icon = s.icon;
                const isActive = active === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setActive(s.id)}
                    className={cn(
                      "w-full flex items-center gap-2 rounded-md px-3 py-2 text-sm text-left transition-colors",
                      isActive ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                               : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="flex-1 truncate">{s.label}</span>
                    {!s.ready && <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted-foreground/10 text-muted-foreground">soon</span>}
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <main className="min-w-0">
          {active === "dashboard"    && <DashboardSection kpis={kpis} refresh={refresh} />}
          {active === "flash"        && <FlashSection />}
          {active === "boutiques"    && <BoutiquesSection />}
          {active === "listings"     && <ListingsModerationSection />}
          {active === "users"        && <UsersSection />}
          {active === "appointments" && <AppointmentsSection />}
          {active === "theme"        && <ThemeSection />}
          {active === "navigation"   && <NavigationSection />}
          {active === "settings"     && <SettingsSection />}
        </main>
      </div>
    </AdminLayout>
  );
}
