import { useEffect, useState } from "react";
import { sb } from "@/integrations/supabase/untyped";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Kpi = { label: string; value: string | number; sub?: string; tone?: "neutral" | "warn" | "danger" | "ok" };

function KpiCard({ k }: { k: Kpi }) {
  const tone = k.tone === "danger" ? "border-destructive/40 bg-destructive/5"
    : k.tone === "warn" ? "border-orange-400/40 bg-orange-50 dark:bg-orange-950/20"
    : k.tone === "ok" ? "border-emerald-400/40 bg-emerald-50 dark:bg-emerald-950/20"
    : "";
  return (
    <Card className={tone}>
      <CardContent className="p-4">
        <p className="text-xs text-muted-foreground">{k.label}</p>
        <p className="text-2xl font-bold mt-1">{k.value}</p>
        {k.sub && <p className="text-xs text-muted-foreground mt-1">{k.sub}</p>}
      </CardContent>
    </Card>
  );
}

export default function AdminV2Dashboard() {
  const { user } = useAuth();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [activity, setActivity] = useState<{ created_at: string; action_type: string; target_type: string | null; target_id: string | null; admin_id: string }[]>([]);
  const [now, setNow] = useState(new Date());
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const sevenDaysAgo = new Date(Date.now() - 7 * 86400000).toISOString();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const weekStart = new Date(Date.now() - 7 * 86400000).toISOString();

    const [activeUsers, listingsActive, newListingsToday, flashLive, openReports, recentLogs] = await Promise.all([
      supabase.from("profiles").select("user_id", { count: "exact", head: true }).gte("updated_at", sevenDaysAgo),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("status", "active"),
      supabase.from("listings").select("id", { count: "exact", head: true }).gte("created_at", todayStart.toISOString()),
      supabase.from("flash_sales").select("id", { count: "exact", head: true })
        .lte("starts_at", new Date().toISOString()).gte("ends_at", new Date().toISOString()),
      supabase.from("client_error_logs").select("id", { count: "exact", head: true }).eq("resolved", false),
      sb.from("audit_logs").select("created_at, action_type, target_type, target_id, admin_id")
        .order("created_at", { ascending: false }).limit(10),
    ]);

    const newShopsThisWeek = await supabase.from("seller_verifications" as never)
      .select("id", { count: "exact", head: true })
      .eq("status", "approved").gte("created_at", weekStart);

    setKpis([
      { label: "Utilisateurs actifs (7j)", value: activeUsers.count ?? 0, sub: "Profils mis à jour récemment" },
      { label: "Annonces actives", value: listingsActive.count ?? 0, sub: `+${newListingsToday.count ?? 0} aujourd'hui` },
      { label: "Boutiques approuvées", value: newShopsThisWeek.count ?? 0, sub: "Approuvées cette semaine" },
      { label: "Ventes Flash en cours", value: flashLive.count ?? 0, sub: "Revenus : 0 $ (placeholder)" },
      { label: "Erreurs ouvertes", value: openReports.count ?? 0, tone: (openReports.count ?? 0) > 5 ? "danger" : (openReports.count ?? 0) > 0 ? "warn" : "ok", sub: "Logs client non résolus" },
      { label: "MRR estimé", value: "0 $", sub: "Pas de plan payant actif" },
    ]);
    setActivity((recentLogs.data as never) ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { document.title = "Tableau de bord exécutif · Admin"; }, []);

  const firstName = (user?.email ?? "Admin").split("@")[0];
  const dateStr = now.toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeStr = now.toLocaleTimeString("fr-CA", { hour: "2-digit", minute: "2-digit" });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Bonjour {firstName}, il est {timeStr}</h1>
          <p className="text-sm text-muted-foreground capitalize">{dateStr}</p>
        </div>
        <Button variant="outline" onClick={() => { setNow(new Date()); load(); }} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} /> Actualiser
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {kpis.map((k) => <KpiCard key={k.label} k={k} />)}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base">Activité récente</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {activity.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">Aucune activité</p>
            ) : activity.map((a, i) => (
              <div key={i} className="flex items-start gap-2 text-sm border-b last:border-0 pb-2">
                <Badge variant="outline" className="text-[10px] mt-0.5">{a.action_type}</Badge>
                <div className="flex-1">
                  <p className="text-muted-foreground">
                    Il y a {formatDistanceToNow(new Date(a.created_at), { locale: fr })}
                    {a.target_type && ` — sur ${a.target_type}`}
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base">À surveiller</CardTitle></CardHeader>
          <CardContent>
            {(kpis[4]?.value as number) > 0 ? (
              <div className="flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-5 w-5" />
                <span className="text-sm">{kpis[4].value} erreur(s) client à examiner</span>
              </div>
            ) : (
              <div className="flex flex-col items-center py-6 text-emerald-600">
                <CheckCircle2 className="h-12 w-12" />
                <p className="text-sm mt-2 font-medium">Tout est sous contrôle</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
