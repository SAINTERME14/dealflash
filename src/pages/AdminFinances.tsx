import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Download, TrendingUp, Users, AlertTriangle, Wallet } from "lucide-react";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type Ticket = Database["public"]["Tables"]["tickets"]["Row"];

type RangeKey = "7d" | "30d" | "90d" | "ytd" | "all";

const RANGE_LABELS: Record<RangeKey, string> = {
  "7d": "7 derniers jours",
  "30d": "30 derniers jours",
  "90d": "90 derniers jours",
  ytd: "Année en cours",
  all: "Tout l'historique",
};

// Estimation Stripe : 2.9% + 0.30 $ par transaction payée (Canada standard)
const STRIPE_FEE_PERCENT = 0.029;
const STRIPE_FEE_FIXED = 0.3;

function fmtCAD(n: number) {
  return n.toLocaleString("fr-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 2 });
}

function rangeStart(range: RangeKey): Date | null {
  const now = new Date();
  switch (range) {
    case "7d":
      return new Date(now.getTime() - 7 * 24 * 3600 * 1000);
    case "30d":
      return new Date(now.getTime() - 30 * 24 * 3600 * 1000);
    case "90d":
      return new Date(now.getTime() - 90 * 24 * 3600 * 1000);
    case "ytd":
      return new Date(now.getFullYear(), 0, 1);
    case "all":
    default:
      return null;
  }
}

interface SellerProfile {
  user_id: string;
  display_name: string | null;
}

export default function AdminFinances() {
  const [range, setRange] = useState<RangeKey>("30d");
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [sellers, setSellers] = useState<SellerProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Finances — Admin DealFlash";
  }, []);

  const load = async () => {
    setLoading(true);
    const start = rangeStart(range);
    let query = supabase.from("tickets").select("*").order("created_at", { ascending: false });
    if (start) query = query.gte("created_at", start.toISOString());
    const { data, error } = await query;
    if (error) {
      toast.error("Erreur de chargement : " + error.message);
      setTickets([]);
    } else {
      setTickets((data ?? []) as Ticket[]);
      const sellerIds = Array.from(new Set((data ?? []).map((t) => t.seller_id)));
      if (sellerIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name")
          .in("user_id", sellerIds);
        setSellers((profiles ?? []) as SellerProfile[]);
      } else {
        setSellers([]);
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  const stats = useMemo(() => {
    const paid = tickets.filter((t) => t.status === "paid" || t.status === "validated");
    const refunded = tickets.filter((t) => t.status === "refunded");
    const cancelled = tickets.filter((t) => t.status === "cancelled");
    const grossRevenue = paid.reduce((s, t) => s + Number(t.total_paid ?? 0), 0);
    const platformCommissions = paid.reduce((s, t) => s + Number(t.platform_fee ?? 0), 0);
    const stripeFees = paid.reduce(
      (s, t) => s + (Number(t.total_paid ?? 0) * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED),
      0,
    );
    const refundedAmount = refunded.reduce((s, t) => s + Number(t.total_paid ?? 0), 0);
    const netSeller = paid.reduce(
      (s, t) => s + (Number(t.flash_price ?? 0) - Number(t.platform_fee ?? 0)),
      0,
    );
    const netPlatform = platformCommissions - stripeFees - refundedAmount * STRIPE_FEE_PERCENT;
    return {
      paidCount: paid.length,
      refundedCount: refunded.length,
      cancelledCount: cancelled.length,
      grossRevenue,
      platformCommissions,
      stripeFees,
      refundedAmount,
      netSeller,
      netPlatform,
    };
  }, [tickets]);

  const sellerLabel = (id: string) => {
    const s = sellers.find((p) => p.user_id === id);
    return s?.display_name?.trim() || id.slice(0, 8);
  };

  const perSeller = useMemo(() => {
    const map = new Map<string, { revenue: number; commission: number; net: number; count: number }>();
    for (const t of tickets) {
      if (t.status !== "paid" && t.status !== "validated") continue;
      const cur = map.get(t.seller_id) ?? { revenue: 0, commission: 0, net: 0, count: 0 };
      cur.revenue += Number(t.total_paid ?? 0);
      cur.commission += Number(t.platform_fee ?? 0);
      cur.net += Number(t.flash_price ?? 0) - Number(t.platform_fee ?? 0);
      cur.count += 1;
      map.set(t.seller_id, cur);
    }
    return Array.from(map.entries())
      .map(([seller_id, v]) => ({ seller_id, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [tickets]);

  const exportCsv = () => {
    const headers = [
      "id",
      "created_at",
      "status",
      "seller_id",
      "seller_name",
      "buyer_email",
      "total_paid",
      "platform_fee",
      "flash_price",
      "currency",
      "stripe_payment_intent",
    ];
    const rows = tickets.map((t) =>
      [
        t.id,
        t.created_at,
        t.status,
        t.seller_id,
        sellerLabel(t.seller_id).replace(/"/g, '""'),
        t.buyer_email.replace(/"/g, '""'),
        t.total_paid,
        t.platform_fee,
        t.flash_price,
        t.currency,
        t.stripe_payment_intent ?? "",
      ]
        .map((v) => `"${String(v ?? "")}"`)
        .join(","),
    );
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `dealflash-finances-${range}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Finances</h1>
          <p className="text-sm text-muted-foreground">
            Revenus, commissions, frais et remboursements sur la période sélectionnée.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              {(Object.keys(RANGE_LABELS) as RangeKey[]).map((k) => (
                <SelectItem key={k} value={k}>{RANGE_LABELS[k]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportCsv} disabled={loading || tickets.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
            <KpiCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Chiffre d'affaires brut"
              value={fmtCAD(stats.grossRevenue)}
              hint={`${stats.paidCount} transaction${stats.paidCount > 1 ? "s" : ""} payée${stats.paidCount > 1 ? "s" : ""}`}
            />
            <KpiCard
              icon={<Wallet className="h-4 w-4" />}
              label="Commissions plateforme"
              value={fmtCAD(stats.platformCommissions)}
              hint="Frais perçus par DealFlash"
            />
            <KpiCard
              icon={<Wallet className="h-4 w-4 text-muted-foreground" />}
              label="Frais Stripe (estimés)"
              value={fmtCAD(stats.stripeFees)}
              hint="2,9 % + 0,30 $ / transaction"
            />
            <KpiCard
              icon={<TrendingUp className="h-4 w-4" />}
              label="Net plateforme"
              value={fmtCAD(stats.netPlatform)}
              hint="Commissions − frais − remboursements"
            />
            <KpiCard
              icon={<Wallet className="h-4 w-4" />}
              label="Net vendeurs (cumulé)"
              value={fmtCAD(stats.netSeller)}
              hint="Reversé aux vendeurs"
            />
            <KpiCard
              icon={<AlertTriangle className="h-4 w-4 text-destructive" />}
              label="Remboursements"
              value={fmtCAD(stats.refundedAmount)}
              hint={`${stats.refundedCount} ticket${stats.refundedCount > 1 ? "s" : ""}`}
            />
            <KpiCard
              icon={<AlertTriangle className="h-4 w-4 text-muted-foreground" />}
              label="Annulés"
              value={String(stats.cancelledCount)}
              hint="Tickets annulés"
            />
            <KpiCard
              icon={<Users className="h-4 w-4" />}
              label="Vendeurs actifs"
              value={String(perSeller.length)}
              hint="Avec ≥ 1 vente sur la période"
            />
          </div>

          {/* Per-seller table */}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-4 w-4" />
              <h2 className="text-lg font-semibold">Tableau par vendeur</h2>
            </div>
            {perSeller.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune vente sur cette période.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vendeur</TableHead>
                    <TableHead className="text-right">Ventes</TableHead>
                    <TableHead className="text-right">CA brut</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Net vendeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {perSeller.map((s) => (
                    <TableRow key={s.seller_id}>
                      <TableCell className="font-medium">{sellerLabel(s.seller_id)}</TableCell>
                      <TableCell className="text-right">{s.count}</TableCell>
                      <TableCell className="text-right">{fmtCAD(s.revenue)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        − {fmtCAD(s.commission)}
                      </TableCell>
                      <TableCell className="text-right font-medium">{fmtCAD(s.net)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>

          {/* Recent transactions */}
          <Card className="mt-6 p-4">
            <h2 className="mb-3 text-lg font-semibold">Transactions récentes</h2>
            {tickets.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                Aucune transaction sur cette période.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Vendeur</TableHead>
                    <TableHead>Acheteur</TableHead>
                    <TableHead className="text-right">Total</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tickets.slice(0, 50).map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="text-xs">
                        {new Date(t.created_at).toLocaleDateString("fr-CA")}
                      </TableCell>
                      <TableCell>
                        <StatusBadge status={t.status} />
                      </TableCell>
                      <TableCell className="text-sm">{sellerLabel(t.seller_id)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{t.buyer_email}</TableCell>
                      <TableCell className="text-right">{fmtCAD(Number(t.total_paid))}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {fmtCAD(Number(t.platform_fee))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {tickets.length > 50 && (
              <p className="mt-3 text-xs text-muted-foreground">
                Affichage des 50 plus récentes — exportez le CSV pour la liste complète.
              </p>
            )}
          </Card>
        </>
      )}
    </AdminLayout>
  );
}

function KpiCard({ icon, label, value, hint }: { icon: React.ReactNode; label: string; value: string; hint?: string }) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </Card>
  );
}

function StatusBadge({ status }: { status: Database["public"]["Enums"]["ticket_status"] }) {
  const map: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
    paid: { label: "Payé", variant: "default" },
    validated: { label: "Validé", variant: "default" },
    pending: { label: "En attente", variant: "outline" },
    refunded: { label: "Remboursé", variant: "destructive" },
    cancelled: { label: "Annulé", variant: "secondary" },
    expired: { label: "Expiré", variant: "secondary" },
  };
  const m = map[status] ?? { label: status, variant: "outline" as const };
  return <Badge variant={m.variant}>{m.label}</Badge>;
}
