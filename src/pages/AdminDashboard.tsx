import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Users,
  Package,
  Sparkles,
  Receipt,
  TrendingUp,
  AlertCircle,
  Loader2,
  ArrowRight,
} from "lucide-react";

type Stats = {
  totalUsers: number;
  totalListings: number;
  activeListings: number;
  featuredActive: number;
  featuredExpiring: number;
  totalTickets: number;
  paidTickets: number;
  revenue: number;
  platformRevenue: number;
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Admin · Vue d'ensemble | DealFlash";
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const nowIso = new Date().toISOString();
      const in48hIso = new Date(Date.now() + 48 * 3600 * 1000).toISOString();

      const [
        usersRes,
        listingsRes,
        activeRes,
        featuredRes,
        expiringRes,
        ticketsRes,
        paidRes,
      ] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }),
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
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
      ]);

      const paidRows = (paidRes.data ?? []) as Array<{
        total_paid: number;
        platform_fee: number;
      }>;
      const revenue = paidRows.reduce((s, r) => s + Number(r.total_paid || 0), 0);
      const platformRevenue = paidRows.reduce((s, r) => s + Number(r.platform_fee || 0), 0);

      setStats({
        totalUsers: usersRes.count ?? 0,
        totalListings: listingsRes.count ?? 0,
        activeListings: activeRes.count ?? 0,
        featuredActive: featuredRes.count ?? 0,
        featuredExpiring: expiringRes.count ?? 0,
        totalTickets: ticketsRes.count ?? 0,
        paidTickets: paidRows.length,
        revenue,
        platformRevenue,
      });
      setLoading(false);
    })();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Vue d'ensemble</h1>
          <p className="text-sm text-muted-foreground">
            Indicateurs clés de la plateforme DealFlash en temps réel.
          </p>
        </div>

        {loading || !stats ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <KpiCard
                icon={Users}
                label="Utilisateurs"
                value={stats.totalUsers.toLocaleString("fr-CA")}
                hint="Comptes inscrits"
              />
              <KpiCard
                icon={Package}
                label="Annonces actives"
                value={`${stats.activeListings.toLocaleString("fr-CA")} / ${stats.totalListings.toLocaleString("fr-CA")}`}
                hint="Actives / total"
              />
              <KpiCard
                icon={Sparkles}
                label="Vedettes en cours"
                value={stats.featuredActive.toLocaleString("fr-CA")}
                hint="Boosts actifs"
                accent
              />
              <KpiCard
                icon={Receipt}
                label="Tickets payés"
                value={`${stats.paidTickets.toLocaleString("fr-CA")} / ${stats.totalTickets.toLocaleString("fr-CA")}`}
                hint="Payés / créés"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-success" />
                    Revenus encaissés
                  </CardTitle>
                  <CardDescription>Tickets payés ou validés</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-3xl font-bold">
                      {stats.revenue.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                    </div>
                    <p className="text-xs text-muted-foreground">Volume total transactionné</p>
                  </div>
                  <div>
                    <div className="text-xl font-semibold text-accent">
                      {stats.platformRevenue.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
                    </div>
                    <p className="text-xs text-muted-foreground">Frais plateforme cumulés</p>
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
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{stats.featuredExpiring}</div>
                      <p className="text-xs text-muted-foreground">Vedettes expirent dans 48 h</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to="/admin/vedette">
                        Gérer <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

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

function KpiCard({
  icon: Icon,
  label,
  value,
  hint,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  hint: string;
  accent?: boolean;
}) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{hint}</p>
          </div>
          <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${accent ? "gradient-accent" : "bg-secondary"}`}>
            <Icon className={`h-5 w-5 ${accent ? "text-accent-foreground" : "text-muted-foreground"}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
