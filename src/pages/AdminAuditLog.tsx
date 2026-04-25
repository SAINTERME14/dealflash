import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  History,
  Loader2,
  Search,
  AlertTriangle,
  Sparkles,
  CreditCard,
  Clock,
  ChevronDown,
  Copy,
  Check,
} from "lucide-react";

type LogRow = {
  id: string;
  listing_id: string;
  actor_id: string | null;
  action: string;
  was_featured: boolean | null;
  is_featured: boolean | null;
  old_priority: number | null;
  new_priority: number | null;
  old_until: string | null;
  new_until: string | null;
  created_at: string;
};

type ListingMini = { id: string; title: string };

type Severity = "critical" | "warning" | "info";

type AlertEntry = {
  id: string;
  severity: Severity;
  source: string;
  title: string;
  description: string;
  created_at: string;
  payload: Record<string, unknown>;
};

const ACTION_COLORS: Record<string, string> = {
  enabled: "bg-success text-success-foreground",
  disabled: "bg-destructive/20 text-destructive",
  renewed: "bg-primary/10 text-primary",
  priority_changed: "bg-secondary text-secondary-foreground",
  updated: "bg-muted text-muted-foreground",
};

const ACTIONS = ["all", "enabled", "disabled", "renewed", "priority_changed"] as const;
type Filter = typeof ACTIONS[number];

const SOURCES = ["all", "cron", "payments", "webhook", "audit"] as const;
type SourceFilter = typeof SOURCES[number];

const SEVERITY_BADGE: Record<Severity, string> = {
  critical: "bg-destructive text-destructive-foreground",
  warning: "bg-warning/20 text-warning-foreground border border-warning/40",
  info: "bg-secondary text-secondary-foreground",
};

const SOURCE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  cron: Sparkles,
  payments: CreditCard,
  webhook: Clock,
  audit: History,
};

export default function AdminAuditLog() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const [alerts, setAlerts] = useState<AlertEntry[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(true);
  const [alertSearch, setAlertSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [openRow, setOpenRow] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Admin · Journal | DealFlash";
  }, []);

  // Load audit log
  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("featured_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      if (!error && data) {
        setRows(data as LogRow[]);
        const ids = [...new Set(data.map((r) => r.listing_id))];
        if (ids.length > 0) {
          const { data: listings } = await supabase
            .from("listings")
            .select("id, title")
            .in("id", ids);
          const map: Record<string, string> = {};
          for (const l of (listings ?? []) as ListingMini[]) map[l.id] = l.title;
          setTitles(map);
        }
      }
      setLoading(false);
    })();
  }, []);

  // Load alerts: aggregate from listings + tickets + audit log
  useEffect(() => {
    (async () => {
      setAlertsLoading(true);
      const nowIso = new Date().toISOString();
      const last7dIso = new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString();
      const stalePendingIso = new Date(Date.now() - 60 * 60 * 1000).toISOString();

      const [staleFeaturedRes, failedTicketsRes, stalePendingRes, expiredTicketsRes, disabledLogRes] =
        await Promise.all([
          supabase
            .from("listings")
            .select("id, title, featured_until, featured_priority, updated_at")
            .eq("is_featured", true)
            .lt("featured_until", nowIso)
            .order("featured_until", { ascending: false })
            .limit(100),
          supabase
            .from("tickets")
            .select("id, listing_id, status, total_paid, currency, buyer_email, updated_at, stripe_session_id")
            .in("status", ["cancelled", "refunded"])
            .gte("updated_at", last7dIso)
            .order("updated_at", { ascending: false })
            .limit(100),
          supabase
            .from("tickets")
            .select("id, listing_id, status, total_paid, currency, buyer_email, created_at, stripe_session_id")
            .eq("status", "pending")
            .lt("created_at", stalePendingIso)
            .order("created_at", { ascending: false })
            .limit(100),
          supabase
            .from("tickets")
            .select("id, listing_id, status, total_paid, currency, buyer_email, expires_at, updated_at")
            .eq("status", "expired")
            .gte("updated_at", last7dIso)
            .order("updated_at", { ascending: false })
            .limit(100),
          supabase
            .from("featured_audit_log")
            .select("*")
            .eq("action", "disabled")
            .gte("created_at", last7dIso)
            .order("created_at", { ascending: false })
            .limit(100),
        ]);

      const collected: AlertEntry[] = [];

      for (const r of staleFeaturedRes.data ?? []) {
        collected.push({
          id: `cron-${r.id}`,
          severity: "warning",
          source: "cron",
          title: "Vedette expirée non nettoyée",
          description: `Annonce « ${r.title} » toujours marquée vedette après expiration.`,
          created_at: r.featured_until || r.updated_at,
          payload: r as unknown as Record<string, unknown>,
        });
      }

      for (const r of failedTicketsRes.data ?? []) {
        collected.push({
          id: `pay-fail-${r.id}`,
          severity: r.status === "refunded" ? "info" : "warning",
          source: "payments",
          title: r.status === "refunded" ? "Paiement remboursé" : "Paiement annulé",
          description: `${r.buyer_email} · ${Number(r.total_paid).toFixed(2)} ${r.currency}`,
          created_at: r.updated_at,
          payload: r as unknown as Record<string, unknown>,
        });
      }

      for (const r of stalePendingRes.data ?? []) {
        collected.push({
          id: `webhook-${r.id}`,
          severity: "critical",
          source: "webhook",
          title: "Ticket bloqué en attente (webhook ?)",
          description: `Ticket « pending » > 1h · ${r.buyer_email} · ${Number(r.total_paid).toFixed(2)} ${r.currency}`,
          created_at: r.created_at,
          payload: r as unknown as Record<string, unknown>,
        });
      }

      for (const r of expiredTicketsRes.data ?? []) {
        collected.push({
          id: `expired-${r.id}`,
          severity: "info",
          source: "payments",
          title: "Ticket expiré non utilisé",
          description: `${r.buyer_email} · expiré le ${new Date(r.expires_at).toLocaleString("fr-CA")}`,
          created_at: r.updated_at,
          payload: r as unknown as Record<string, unknown>,
        });
      }

      for (const r of disabledLogRes.data ?? []) {
        collected.push({
          id: `audit-${r.id}`,
          severity: "info",
          source: "audit",
          title: "Boost vedette désactivé",
          description: r.actor_id
            ? `Désactivation manuelle par admin (${r.actor_id.slice(0, 8)}…)`
            : "Désactivation automatique (système)",
          created_at: r.created_at,
          payload: r as unknown as Record<string, unknown>,
        });
      }

      collected.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setAlerts(collected);
      setAlertsLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.action !== filter) return false;
      if (!q) return true;
      return (titles[r.listing_id] ?? "").toLowerCase().includes(q);
    });
  }, [rows, search, filter, titles]);

  const filteredAlerts = useMemo(() => {
    const q = alertSearch.trim().toLowerCase();
    return alerts.filter((a) => {
      if (sourceFilter !== "all" && a.source !== sourceFilter) return false;
      if (!q) return true;
      return (
        a.title.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q) ||
        a.source.toLowerCase().includes(q) ||
        JSON.stringify(a.payload).toLowerCase().includes(q)
      );
    });
  }, [alerts, alertSearch, sourceFilter]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Journal</h1>
            <p className="text-sm text-muted-foreground">
              Alertes système et historique des changements de boost vedette.
            </p>
          </div>
        </div>

        <Tabs defaultValue="alerts">
          <TabsList>
            <TabsTrigger value="alerts" className="gap-1.5">
              <AlertTriangle className="h-3.5 w-3.5" />
              Alertes
              {alerts.length > 0 && (
                <Badge variant="secondary" className="ml-1 text-[10px] h-4 px-1.5">
                  {alerts.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-1.5">
              <History className="h-3.5 w-3.5" />
              Audit Vedette
            </TabsTrigger>
          </TabsList>

          {/* ALERTS TAB */}
          <TabsContent value="alerts" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={alertSearch}
                    onChange={(e) => setAlertSearch(e.target.value)}
                    placeholder="Rechercher dans titre, description, payload…"
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {SOURCES.map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={sourceFilter === s ? "default" : "outline"}
                      onClick={() => setSourceFilter(s)}
                      className="text-xs"
                    >
                      {s === "all" ? "Toutes" : s}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {alertsLoading ? (
                  <div className="py-16 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filteredAlerts.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Aucune alerte. Tous les systèmes sont nominaux.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[160px]">Date</TableHead>
                        <TableHead className="w-[110px]">Source</TableHead>
                        <TableHead className="w-[100px]">Sévérité</TableHead>
                        <TableHead>Détail</TableHead>
                        <TableHead className="w-[40px]" />
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAlerts.map((a) => {
                        const Icon = SOURCE_ICON[a.source] ?? AlertTriangle;
                        const isOpen = openRow === a.id;
                        return (
                          <Collapsible
                            key={a.id}
                            open={isOpen}
                            onOpenChange={(o) => setOpenRow(o ? a.id : null)}
                            asChild
                          >
                            <>
                              <TableRow>
                                <TableCell className="text-xs whitespace-nowrap text-muted-foreground">
                                  {new Date(a.created_at).toLocaleString("fr-CA")}
                                </TableCell>
                                <TableCell>
                                  <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                    <Icon className="h-3.5 w-3.5" />
                                    {a.source}
                                  </span>
                                </TableCell>
                                <TableCell>
                                  <Badge className={`text-[10px] ${SEVERITY_BADGE[a.severity]}`}>
                                    {a.severity}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="text-sm font-medium">{a.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {a.description}
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <CollapsibleTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-7 w-7"
                                      aria-label="Voir le payload"
                                    >
                                      <ChevronDown
                                        className={`h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
                                      />
                                    </Button>
                                  </CollapsibleTrigger>
                                </TableCell>
                              </TableRow>
                              <CollapsibleContent asChild>
                                <TableRow className="bg-muted/30 hover:bg-muted/30">
                                  <TableCell colSpan={5} className="p-0">
                                    <div className="relative group">
                                      <pre className="text-[11px] font-mono p-4 pr-12 overflow-x-auto whitespace-pre-wrap break-all text-muted-foreground">
                                        {JSON.stringify(a.payload, null, 2)}
                                      </pre>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="absolute top-2 right-2 h-7 gap-1 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={async () => {
                                          await navigator.clipboard.writeText(JSON.stringify(a.payload, null, 2));
                                          setCopiedId(a.id);
                                          setTimeout(() => setCopiedId(null), 1500);
                                        }}
                                      >
                                        {copiedId === a.id ? (
                                          <>
                                            <Check className="h-3 w-3" />
                                            Copié
                                          </>
                                        ) : (
                                          <>
                                            <Copy className="h-3 w-3" />
                                            Copier
                                          </>
                                        )}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              </CollapsibleContent>
                            </>
                          </Collapsible>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* AUDIT TAB */}
          <TabsContent value="audit" className="space-y-4 mt-4">
            <Card>
              <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Titre d'annonce…"
                    className="pl-9"
                  />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  {ACTIONS.map((a) => (
                    <Button
                      key={a}
                      size="sm"
                      variant={filter === a ? "default" : "outline"}
                      onClick={() => setFilter(a)}
                      className="text-xs"
                    >
                      {a === "all" ? "Toutes" : a}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-0">
                {loading ? (
                  <div className="py-16 flex justify-center">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  </div>
                ) : filtered.length === 0 ? (
                  <p className="py-16 text-center text-sm text-muted-foreground">
                    Aucun événement.
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Annonce</TableHead>
                        <TableHead>Action</TableHead>
                        <TableHead>Détail</TableHead>
                        <TableHead>Acteur</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {new Date(r.created_at).toLocaleString("fr-CA")}
                          </TableCell>
                          <TableCell className="text-sm font-medium">
                            {titles[r.listing_id] ?? <span className="text-muted-foreground italic">supprimée</span>}
                          </TableCell>
                          <TableCell>
                            <Badge className={`text-[10px] ${ACTION_COLORS[r.action] ?? "bg-secondary"}`}>
                              {r.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs text-muted-foreground">
                            {r.action === "renewed" && r.new_until && (
                              <>jusqu'au {new Date(r.new_until).toLocaleDateString("fr-CA")}</>
                            )}
                            {r.action === "priority_changed" && (
                              <>priorité {r.old_priority ?? 0} → {r.new_priority ?? 0}</>
                            )}
                            {r.action === "enabled" && r.new_until && (
                              <>boost actif jusqu'au {new Date(r.new_until).toLocaleDateString("fr-CA")}</>
                            )}
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground">
                            {r.actor_id ? `${r.actor_id.slice(0, 8)}…` : "système"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
