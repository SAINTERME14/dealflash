import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertTriangle,
  CreditCard,
  Clock,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  Loader2,
  RefreshCw,
} from "lucide-react";

type Severity = "critical" | "warning" | "info";

type Alert = {
  id: string;
  severity: Severity;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  count: number;
  cta?: { label: string; to: string };
};

const severityStyles: Record<Severity, string> = {
  critical: "border-destructive/40 bg-destructive/5",
  warning: "border-warning/40 bg-warning/5",
  info: "border-border bg-muted/30",
};

const badgeVariant: Record<Severity, "destructive" | "secondary" | "outline"> = {
  critical: "destructive",
  warning: "secondary",
  info: "outline",
};

export function AdminAlertsPanel() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    const nowIso = new Date().toISOString();
    const last24hIso = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const last7dIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
    const stalePendingIso = new Date(Date.now() - 60 * 60 * 1000).toISOString(); // 1h

    const [
      staleFeaturedRes,
      failedPaymentsRes,
      stalePendingTicketsRes,
      recentDisabledRes,
      expiredTicketsRes,
    ] = await Promise.all([
      // Vedettes expirées non nettoyées (cron en retard / échec)
      supabase
        .from("listings")
        .select("id", { count: "exact", head: true })
        .eq("is_featured", true)
        .lt("featured_until", nowIso),
      // Paiements échoués / annulés sur 24h
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .in("status", ["cancelled", "refunded"])
        .gte("updated_at", last24hIso),
      // Tickets bloqués en "pending" depuis > 1h
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending")
        .lt("created_at", stalePendingIso),
      // Désactivations récentes via audit (peut indiquer expirations en cascade)
      supabase
        .from("featured_audit_log")
        .select("id", { count: "exact", head: true })
        .eq("action", "disabled")
        .gte("created_at", last24hIso),
      // Tickets expirés non traités sur 7j
      supabase
        .from("tickets")
        .select("id", { count: "exact", head: true })
        .eq("status", "expired")
        .gte("updated_at", last7dIso),
    ]);

    const next: Alert[] = [];

    const staleFeatured = staleFeaturedRes.count ?? 0;
    if (staleFeatured > 0) {
      next.push({
        id: "stale-featured",
        severity: staleFeatured > 5 ? "critical" : "warning",
        icon: Sparkles,
        title: "Vedettes expirées non nettoyées",
        description:
          "Le job cron d'expiration semble en retard. Ces annonces sont encore marquées « Vedette » alors que leur date est dépassée.",
        count: staleFeatured,
        cta: { label: "Gérer", to: "/admin/vedette?filter=expired" },
      });
    }

    const failedPayments = failedPaymentsRes.count ?? 0;
    if (failedPayments > 0) {
      next.push({
        id: "failed-payments",
        severity: failedPayments > 10 ? "critical" : "warning",
        icon: CreditCard,
        title: "Échecs de paiement (24 h)",
        description: "Tickets annulés ou remboursés sur les dernières 24 heures.",
        count: failedPayments,
        cta: { label: "Voir les tickets", to: "/admin/tickets" },
      });
    }

    const stalePending = stalePendingTicketsRes.count ?? 0;
    if (stalePending > 0) {
      next.push({
        id: "stale-pending",
        severity: stalePending > 3 ? "critical" : "warning",
        icon: Clock,
        title: "Tickets bloqués en attente",
        description:
          "Tickets en statut « pending » depuis plus d'une heure — possible échec du webhook Stripe.",
        count: stalePending,
        cta: { label: "Inspecter", to: "/admin/tickets" },
      });
    }

    const recentDisabled = recentDisabledRes.count ?? 0;
    if (recentDisabled > 0) {
      next.push({
        id: "recent-disabled",
        severity: "info",
        icon: AlertTriangle,
        title: "Désactivations Vedette (24 h)",
        description: "Boosts désactivés récemment (manuellement ou par expiration).",
        count: recentDisabled,
        cta: { label: "Voir le journal", to: "/admin/journal" },
      });
    }

    const expiredTickets = expiredTicketsRes.count ?? 0;
    if (expiredTickets > 0) {
      next.push({
        id: "expired-tickets",
        severity: "info",
        icon: Clock,
        title: "Tickets expirés (7 j)",
        description: "Tickets payés non utilisés avant leur date d'expiration.",
        count: expiredTickets,
        cta: { label: "Voir les tickets", to: "/admin/tickets" },
      });
    }

    setAlerts(next);
    setLastRefresh(new Date());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Alertes système
            </CardTitle>
            <CardDescription>
              Anomalies détectées (cron, paiements, webhooks).
              {lastRefresh && (
                <span className="ml-1 text-xs">
                  · MAJ {lastRefresh.toLocaleTimeString("fr-CA")}
                </span>
              )}
            </CardDescription>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={load}
            disabled={loading}
            aria-label="Rafraîchir les alertes"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && alerts.length === 0 ? (
          <div className="flex justify-center py-6">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="flex items-center gap-2 rounded-md border border-success/30 bg-success/5 p-4 text-sm">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <span>Aucune anomalie détectée. Tous les systèmes sont nominaux.</span>
          </div>
        ) : (
          <>
            {alerts.map((a) => {
              const Icon = a.icon;
              return (
                <div
                  key={a.id}
                  className={`flex items-start gap-3 rounded-md border p-3 ${severityStyles[a.severity]}`}
                >
                  <div className="mt-0.5">
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{a.title}</span>
                      <Badge variant={badgeVariant[a.severity]} className="text-xs">
                        {a.count}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{a.description}</p>
                  </div>
                  {a.cta && (
                    <Button asChild size="sm" variant="outline" className="shrink-0">
                      <Link to={a.cta.to}>
                        {a.cta.label} <ArrowRight className="h-3.5 w-3.5 ml-1" />
                      </Link>
                    </Button>
                  )}
                </div>
              );
            })}
            <div className="pt-2 text-right">
              <Button asChild size="sm" variant="ghost">
                <Link to="/admin/journal">
                  Voir le journal complet <ArrowRight className="h-3.5 w-3.5 ml-1" />
                </Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
