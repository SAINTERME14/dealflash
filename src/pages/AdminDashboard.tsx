import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdminAlertsPanel } from "@/components/admin/AdminAlertsPanel";
import { getAdminFlashItems } from "@/data/flashItems";
import { getAdminBoutiques } from "@/data/boutiquesData";
import { getPartners } from "@/data/partnersData";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Package,
  Sparkles,
  Receipt,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck,
  UserPlus,
  LifeBuoy,
  Boxes,
  RefreshCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  Tooltip as RTooltip,
} from "recharts";

const REFRESH_MS = 60_000;

type Stats = {
  totalUsers: number;
  newUsers7d: number;
  newUsersPrev7d: number;

  totalListings: number;
  activeListings: number;
  newListings7d: number;
  newListingsPrev7d: number;

  featuredActive: number;
  featuredExpiring: number;

  totalTickets: number;
  paidTickets: number;
  paidTickets7d: number;
  paidTicketsPrev7d: number;

  revenue: number;
  revenue7d: number;
  revenuePrev7d: number;
  platformRevenue: number;

  kycPending: number;
  sellerAppsPending: number;
  supportOpen: number;
  dropshipPending: number;

  revenueDaily: { date: string; revenue: number }[];
};

const formatCAD = (n: number) =>
  n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });

const growth = (curr: number, prev: number): { pct: number; up: boolean } | null => {
  if (prev === 0 && curr === 0) return null;
  if (prev === 0) return { pct: 100, up: true };
  const pct = ((curr - prev) / prev) * 100;
  return { pct: Math.round(pct), up: pct >= 0 };
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  useEffect(() => {
    document.title = "Admin · Vue d'ensemble | Boardeal";
  }, []);

  const load = async () => {
    setLoading(true);
    const now = new Date();
    const nowIso = now.toISOString();
    const in48hIso = new Date(now.getTime() + 48 * 3600 * 1000).toISOString();
    const d7Iso = new Date(now.getTime() - 7 * 24 * 3600 * 1000).toISOString();
    const d14Iso = new Date(now.getTime() - 14 * 24 * 3600 * 1000).toISOString();

    const [
      usersRes,
      newUsers7Res,
      newUsersPrev7Res,
      listingsRes,
      activeRes,
      newListings7Res,
      newListingsPrev7Res,
      featuredRes,
      expiringRes,
      ticketsRes,
      paidAllRes,
      paid14dRes,
      kycRes,
      sellerAppsRes,
      supportRes,
      dropshipRes,
    ] = await Promise.all([
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("profiles").select("id", { count: "exact", head: true }).gte("created_at", d7Iso),
      supabase
        .from("profiles")
        .select("id", { count: "exact", head: true })
        .gte("created_at", d14Iso)
        .lt("created_at", d7Iso),
      supabase.from("listings").select("id", { count: "exact", head: true }),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("id", { count: "exact", head: true }).gte("created_at", d7Iso),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .gte("created_at", d14Iso)
        .lt("created_at", d7Iso),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("is_featured", true)
        .or(`featured_until.is.null,featured_until.gt.${nowIso}`),
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("is_featured", true)
        .gt("featured_until", nowIso)
        .lte("featured_until", in48hIso),
      supabase.from("tickets").select("id", { count: "exact", head: true }),
      supabase
        .from("tickets")
        .select("total_paid, platform_fee, status")
        .in("status", ["paid", "validated"]),
      supabase
        .from("tickets")
        .select("total_paid, created_at, status")
        .in("status", ["paid", "validated"])
        .gte("created_at", d14Iso),
      supabase
        .from("seller_verifications")
        .select("id", { count: "exact", head: true })
        .in("status", ["submitted", "under_review", "more_info_required"]),
      supabase
        .from("seller_applications")
        .select("id", { count: "exact", head: true })
        .in("status", ["new", "contacted"]),
      supabase
        .from("support_tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["open", "in_progress", "waiting_user"]),
      supabase
        .from("dropship_orders")
        .select("id", { count: "exact", head: true })
        .in("status", ["pending", "ordered", "shipped"]),
    ]);

    const paidAllRows = (paidAllRes.data ?? []) as Array<{
      total_paid: number;
      platform_fee: number;
    }>;
    const revenue = paidAllRows.reduce((s, r) => s + Number(r.total_paid || 0), 0);
    const platformRevenue = paidAllRows.reduce((s, r) => s + Number(r.platform_fee || 0), 0);

    const paid14dRows = (paid14dRes.data ?? []) as Array<{
      total_paid: number;
      created_at: string;
    }>;
    const sevenAgo = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    let revenue7d = 0;
    let revenuePrev7d = 0;
    let paidTickets7d = 0;
    let paidTicketsPrev7d = 0;
    paid14dRows.forEach((r) => {
      const d = new Date(r.created_at);
      const amt = Number(r.total_paid || 0);
      if (d >= sevenAgo) {
        revenue7d += amt;
        paidTickets7d += 1;
      } else {
        revenuePrev7d += amt;
        paidTicketsPrev7d += 1;
      }
    });

    const days: Record<string, number> = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now.getTime() - i * 24 * 3600 * 1000);
      const key = d.toISOString().slice(0, 10);
      days[key] = 0;
    }
    paid14dRows.forEach((r) => {
      const key = new Date(r.created_at).toISOString().slice(0, 10);
      if (key in days) days[key] += Number(r.total_paid || 0);
    });
    const revenueDaily = Object.entries(days).map(([date, revenue]) => ({ date, revenue }));

    setStats({
      totalUsers: usersRes.count ?? 0,
      newUsers7d: newUsers7Res.count ?? 0,
      newUsersPrev7d: newUsersPrev7Res.count ?? 0,
      totalListings: listingsRes.count ?? 0,
      activeListings: activeRes.count ?? 0,
      newListings7d: newListings7Res.count ?? 0,
      newListingsPrev7d: newListingsPrev7Res.count ?? 0,
      featuredActive: featuredRes.count ?? 0,
      featuredExpiring: expiringRes.count ?? 0,
      totalTickets: ticketsRes.count ?? 0,
      paidTickets: paidAllRows.length,
      paidTickets7d,
      paidTicketsPrev7d,
      revenue,
      revenue7d,
      revenuePrev7d,
      platformRevenue,
      kycPending: kycRes.count ?? 0,
      sellerAppsPending: sellerAppsRes.count ?? 0,
      supportOpen: supportRes.count ?? 0,
      dropshipPending: dropshipRes.count ?? 0,
      revenueDaily,
    });
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, REFRESH_MS);
    return () => clearInterval(t);
  }, []);

  const usersGrowth = useMemo(
    () => (stats ? growth(stats.newUsers7d, stats.newUsersPrev7d) : null),
    [stats]
  );
  const listingsGrowth = useMemo(
    () => (stats ? growth(stats.newListings7d, stats.newListingsPrev7d) : null),
    [stats]
  );
  const ticketsGrowth = useMemo(
    () => (stats ? growth(stats.paidTickets7d, stats.paidTicketsPrev7d) : null),
    [stats]
  );
  const revenueGrowth = useMemo(
    () => (stats ? growth(stats.revenue7d, stats.revenuePrev7d) : null),
    [stats]
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <FlashBoutiqueKpiRow />

        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
            <p className="text-sm text-muted-foreground">
              Indicateurs clés de la plateforme Boardeal en temps réel.
              {lastRefresh && (
                <span className="ml-1 text-xs">
                  · MAJ {lastRefresh.toLocaleTimeString("fr-CA")}
                </span>
              )}
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Rafraîchir
          </Button>
        </div>

        {loading && !stats ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !stats ? null : (
          <>
            <ActionRequiredBar
              kyc={stats.kycPending}
              apps={stats.sellerAppsPending}
              support={stats.supportOpen}
              dropship={stats.dropshipPending}
            />

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={Users}
                label="Utilisateurs"
                value={stats.totalUsers.toLocaleString("fr-CA")}
                subValue={`+${stats.newUsers7d} cette semaine`}
                growth={usersGrowth}
              />
              <KpiCard
                icon={Package}
                label="Annonces actives"
                value={stats.activeListings.toLocaleString("fr-CA")}
                subValue={`+${stats.newListings7d} cette semaine`}
                growth={listingsGrowth}
              />
              <KpiCard
                icon={Receipt}
                label="Ventes (7 j)"
                value={stats.paidTickets7d.toLocaleString("fr-CA")}
                subValue={`${stats.paidTickets} au total`}
                growth={ticketsGrowth}
              />
              <KpiCard
                icon={Sparkles}
                label="Vedettes actives"
                value={stats.featuredActive.toLocaleString("fr-CA")}
                subValue={
                  stats.featuredExpiring > 0
                    ? `${stats.featuredExpiring} expire(nt) sous 48 h`
                    : "Aucune expiration imminente"
                }
                accent
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Revenus (14 derniers jours)
                  </CardTitle>
                  <CardDescription>
                    {formatCAD(stats.revenue7d)} sur 7 j
                    {revenueGrowth && (
                      <span
                        className={`ml-2 font-medium ${
                          revenueGrowth.up ? "text-success" : "text-destructive"
                        }`}
                      >
                        {revenueGrowth.up ? "▲" : "▼"} {Math.abs(revenueGrowth.pct)}%
                      </span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-32">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={stats.revenueDaily}>
                        <defs>
                          <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                            <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" hide />
                        <RTooltip
                          contentStyle={{
                            background: "hsl(var(--card))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: 6,
                            fontSize: 12,
                          }}
                          formatter={(v: number) => [formatCAD(v), "Revenu"]}
                          labelFormatter={(l) =>
                            new Date(l).toLocaleDateString("fr-CA", {
                              day: "2-digit",
                              month: "short",
                            })
                          }
                        />
                        <Area
                          type="monotone"
                          dataKey="revenue"
                          stroke="hsl(var(--primary))"
                          strokeWidth={2}
                          fill="url(#revGrad)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-xs text-muted-foreground">Volume total</p>
                      <p className="font-semibold">{formatCAD(stats.revenue)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Frais plateforme</p>
                      <p className="font-semibold text-accent">{formatCAD(stats.platformRevenue)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    À surveiller
                  </CardTitle>
                  <CardDescription>Actions à mener sous peu</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <WatchRow
                    label="Vedettes expirent dans 48 h"
                    count={stats.featuredExpiring}
                    to="/admin/vedette"
                  />
                  <WatchRow
                    label="Tickets payés en attente d'utilisation"
                    count={stats.paidTickets - stats.paidTickets7d}
                    to="/admin/tickets"
                    muted
                  />
                  <WatchRow
                    label="Annonces brouillon ou en pause"
                    count={stats.totalListings - stats.activeListings}
                    to="/admin/vedette"
                    muted
                  />
                </CardContent>
              </Card>
            </div>

            <AdminAlertsPanel />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Raccourcis</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/vedette">Sélection sponsorisée</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/utilisateurs">Utilisateurs & rôles</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/tickets">Tickets & revenus</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/finances">Finances</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/dropshipping">Dropshipping</Link>
                </Button>
                <Button asChild variant="outline" size="sm">
                  <Link to="/admin/journal">Journal d'audit</Link>
                </Button>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AdminLayout>
  );
}

function FlashBoutiqueKpiRow() {
  const flashItems = getAdminFlashItems();
  const boutiques = getAdminBoutiques();
  const partners = getPartners();

  const flashActive = flashItems.filter((i) => i.status === "active").length;
  const flashExpired = flashItems.filter((i) => i.status === "expired").length;
  const flashPending = flashItems.filter((i) => i.status === "pending").length;
  const boutiquesActive = boutiques.filter((b) => b.status === "active").length;
  const partnersVisible = partners.filter((p) => p.visible).length;

  const cards = [
    { icon: "⚡", label: "Flash actives", value: flashActive, color: "#22c55e" },
    { icon: "⏰", label: "Flash expirées", value: flashExpired, color: "#ef4444" },
    { icon: "⏳", label: "Flash en attente", value: flashPending, color: "#f59e0b" },
    { icon: "🏪", label: "Boutiques actives", value: boutiquesActive, color: "#3b82f6" },
    { icon: "🤝", label: "Partenaires affichés", value: `${partnersVisible}/${partners.length}`, color: "#FFD000" },
  ];

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 12 }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            background: "#1a1a1a",
            borderTop: "3px solid #FFD000",
            borderRadius: 10,
            padding: "16px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <div style={{ fontSize: 22 }}>{c.icon}</div>
          <div style={{ fontSize: 11, color: "#888", textTransform: "uppercase", letterSpacing: 0.5 }}>{c.label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "white", lineHeight: 1 }}>{c.value}</div>
          <div style={{ width: 32, height: 3, background: c.color, borderRadius: 2, marginTop: 2 }} />
        </div>
      ))}
    </div>
  );
}

function ActionRequiredBar({
  kyc,
  apps,
  support,
  dropship,
}: {
  kyc: number;
  apps: number;
  support: number;
  dropship: number;
}) {
  const items = [
    { count: kyc, label: "KYC à examiner", to: "/admin/verifications", icon: ShieldCheck, color: "text-primary" },
    { count: apps, label: "Demandes vendeurs", to: "/admin/demandes-vendeurs", icon: UserPlus, color: "text-accent" },
    { count: support, label: "Tickets support", to: "/admin/support", icon: LifeBuoy, color: "text-warning" },
    { count: dropship, label: "Commandes dropship", to: "/admin/dropship-orders", icon: Boxes, color: "text-success" },
  ];
  const total = items.reduce((s, i) => s + i.count, 0);
  if (total === 0) return null;

  return (
    <Card className="border-warning/40 bg-warning/5">
      <CardContent className="py-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm font-medium">Actions requises</p>
          <div className="flex flex-wrap gap-2">
            {items
              .filter((i) => i.count > 0)
              .map((i) => {
                const Icon = i.icon;
                return (
                  <Button key={i.to} asChild size="sm" variant="outline">
                    <Link to={i.to}>
                      <Icon className={`h-4 w-4 mr-1.5 ${i.color}`} />
                      {i.label}
                      <Badge variant="secondary" className="ml-2">
                        {i.count}
                      </Badge>
                    </Link>
                  </Button>
                );
              })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function WatchRow({
  label,
  count,
  to,
  muted,
}: {
  label: string;
  count: number;
  to: string;
  muted?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div>
        <div className={`text-xl font-bold ${muted && count === 0 ? "text-muted-foreground" : ""}`}>
          {count}
        </div>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
      {count > 0 && (
        <Button asChild size="sm" variant="ghost">
          <Link to={to}>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      )}
    </div>
  );
}

function KpiCard({
  icon: Icon,
  label,
  value,
  subValue,
  growth,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  subValue?: string;
  growth?: { pct: number; up: boolean } | null;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <div className="flex items-baseline gap-2 mt-1">
              <p className="text-2xl font-bold">{value}</p>
              {growth && (
                <span
                  className={`text-xs font-medium flex items-center ${
                    growth.up ? "text-success" : "text-destructive"
                  }`}
                >
                  {growth.up ? (
                    <TrendingUp className="h-3 w-3 mr-0.5" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-0.5" />
                  )}
                  {Math.abs(growth.pct)}%
                </span>
              )}
            </div>
            {subValue && <p className="text-xs text-muted-foreground mt-1 truncate">{subValue}</p>}
          </div>
          <div
            className={`h-10 w-10 rounded-lg flex items-center justify-center shrink-0 ${
              accent ? "gradient-accent" : "bg-secondary"
            }`}
          >
            <Icon
              className={`h-5 w-5 ${accent ? "text-accent-foreground" : "text-muted-foreground"}`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
