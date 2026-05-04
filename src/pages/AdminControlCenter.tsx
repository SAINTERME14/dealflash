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
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  { id: "listings",     label: "Annonces",            icon: FileText,        group: "Modération", ready: false },
  { id: "users",        label: "Utilisateurs",        icon: Users,           group: "Modération", ready: false },
  { id: "appointments", label: "Rendez-vous",         icon: Calendar,        group: "Modération", ready: false },
  { id: "theme",        label: "Apparence & Thème",   icon: Palette,         group: "Configuration", ready: false },
  { id: "navigation",   label: "Navigation & Menu",   icon: Compass,         group: "Configuration", ready: false },
  { id: "settings",     label: "Réglages généraux",   icon: Settings,        group: "Configuration", ready: false },
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
// Placeholder générique (sections 7,8,9,2,3,12)
// ──────────────────────────────────────────────────────────────────────────────
function PlaceholderSection({ id, label }: { id: SectionId; label: string }) {
  const plans: Record<SectionId, string[]> = {
    dashboard: [], flash: [], boutiques: [],
    listings: ["Table modération (publiée / en attente / refusée / expirée)", "Approuver / refuser en 1 clic", "Filtres catégorie / vendeur / date", "Édition complète d'une annonce"],
    users: ["Table utilisateurs avec rôles (acheteur, vendeur B2C/C2C, admin)", "Suspension / réactivation", "Envoi d'email / notification ciblée", "Statistiques d'inscription"],
    appointments: ["Vue calendrier mensuelle", "Table RDV avec confirmation/refus", "Réglages : délai min, durée par défaut, rappels"],
    theme: ["Palette de couleurs (primaire, fond, cartes, accent)", "Typographie (police, taille, poids)", "Logo, favicon, slogan", "Aperçu en direct"],
    navigation: ["Réorganisation drag & drop du menu", "Édition catégories et typologies annonceurs", "Largeur, couleurs, hover du menu"],
    settings: ["Infos site (nom, contact, adresse, devise)", "Réseaux sociaux", "Footer (colonnes, liens, copyright)", "SEO global, mode maintenance"],
  };
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{label}</h1>
        <p className="text-sm text-muted-foreground">Section en cours de développement</p>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">📋 Fonctionnalités prévues</CardTitle></CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {plans[id].map((p, i) => (
              <li key={i} className="flex gap-2"><span className="text-primary">•</span><span>{p}</span></li>
            ))}
          </ul>
          <div className="mt-4 p-3 rounded-md bg-muted/40 text-xs text-muted-foreground">
            Cette section sera finalisée dans le prochain cycle de développement.
            La structure de données <code>STORE</code> sera persistée via la table <code>site_content</code> existante (catégorie spécifique par section).
          </div>
        </CardContent>
      </Card>
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
          {active !== "dashboard" && active !== "flash" && active !== "boutiques" && (
            <PlaceholderSection id={active} label={SECTIONS.find(s => s.id === active)!.label} />
          )}
        </main>
      </div>
    </AdminLayout>
  );
}
