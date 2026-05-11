import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Receipt, Search } from "lucide-react";

type Ticket = {
  id: string;
  confirmation_code: string;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_email: string;
  total_paid: number;
  platform_fee: number;
  flash_price: number;
  currency: string;
  status: string;
  created_at: string;
  expires_at: string;
  listing_id: string;
};

const STATUSES = ["all", "pending", "paid", "validated", "expired", "refunded", "cancelled"] as const;
type Filter = typeof STATUSES[number];

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-muted text-muted-foreground",
  paid: "bg-success text-success-foreground",
  validated: "bg-primary text-primary-foreground",
  expired: "bg-destructive/20 text-destructive",
  refunded: "bg-warning/20 text-warning",
  cancelled: "bg-destructive text-destructive-foreground",
};

export default function AdminTickets() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    document.title = "Admin · Tickets | Boardeal";
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("tickets")
        .select("id, confirmation_code, buyer_first_name, buyer_last_name, buyer_email, total_paid, platform_fee, flash_price, currency, status, created_at, expires_at, listing_id")
        .order("created_at", { ascending: false })
        .limit(300);
      if (!error && data) setTickets(data as Ticket[]);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return tickets.filter((t) => {
      if (filter !== "all" && t.status !== filter) return false;
      if (!q) return true;
      return (
        t.confirmation_code.toLowerCase().includes(q) ||
        t.buyer_email.toLowerCase().includes(q) ||
        `${t.buyer_first_name} ${t.buyer_last_name}`.toLowerCase().includes(q)
      );
    });
  }, [tickets, search, filter]);

  const totals = useMemo(() => {
    const paid = filtered.filter((t) => t.status === "paid" || t.status === "validated");
    return {
      count: filtered.length,
      revenue: paid.reduce((s, t) => s + Number(t.total_paid || 0), 0),
      fees: paid.reduce((s, t) => s + Number(t.platform_fee || 0), 0),
    };
  }, [filtered]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Receipt className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Tickets &amp; revenus</h1>
            <p className="text-sm text-muted-foreground">
              Suivi des paiements, frais plateforme et statuts.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <SmallStat label="Tickets affichés" value={totals.count.toLocaleString("fr-CA")} />
          <SmallStat
            label="Revenu (filtré)"
            value={totals.revenue.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
          />
          <SmallStat
            label="Frais plateforme"
            value={totals.fees.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
            accent
          />
        </div>

        <Card>
          <CardContent className="p-4 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Code, email, acheteur…"
                className="pl-9"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {STATUSES.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={filter === s ? "default" : "outline"}
                  onClick={() => setFilter(s)}
                  className="capitalize text-xs"
                >
                  {s === "all" ? "Tous" : s}
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
                Aucun ticket pour ces filtres.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Acheteur</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Payé</TableHead>
                    <TableHead className="text-right">Frais</TableHead>
                    <TableHead>Créé</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell className="font-mono text-xs">{t.confirmation_code}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">
                          {t.buyer_first_name} {t.buyer_last_name}
                        </div>
                        <div className="text-xs text-muted-foreground">{t.buyer_email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`text-[10px] ${STATUS_COLORS[t.status] ?? "bg-secondary"}`}>
                          {t.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {Number(t.total_paid).toLocaleString("fr-CA", {
                          style: "currency",
                          currency: t.currency || "CAD",
                        })}
                      </TableCell>
                      <TableCell className="text-right text-accent">
                        {Number(t.platform_fee).toLocaleString("fr-CA", {
                          style: "currency",
                          currency: t.currency || "CAD",
                        })}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString("fr-CA")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function SmallStat({
  label, value, accent,
}: { label: string; value: string; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold mt-1 ${accent ? "text-accent" : ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
