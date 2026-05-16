import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Wallet, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

type Row = {
  id: string;
  beneficiary_user_id: string;
  role: string;
  pct: number;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "paid" | "cancelled";
  created_at: string;
  qr_conversion_id: string;
};

const STATUS_VARIANT: Record<Row["status"], "default" | "secondary" | "destructive" | "outline"> = {
  pending: "secondary",
  approved: "outline",
  paid: "default",
  cancelled: "destructive",
};

export default function AdminCommissions() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Commissions | Admin Boardeal";
    load();
  }, []);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("commissions")
      .select("id,beneficiary_user_id,role,pct,amount,currency,status,created_at,qr_conversion_id")
      .order("created_at", { ascending: false })
      .limit(500);
    setRows((data as Row[]) ?? []);
    setLoading(false);
  }

  async function setStatus(r: Row, status: Row["status"]) {
    const { error } = await supabase.from("commissions").update({ status }).eq("id", r.id);
    if (error) return toast.error(error.message);
    toast.success(`Statut → ${status}`);
    load();
  }

  const totals = rows.reduce(
    (acc, r) => {
      acc.total += Number(r.amount);
      if (r.status === "pending") acc.pending += Number(r.amount);
      if (r.status === "paid") acc.paid += Number(r.amount);
      if (r.status === "cancelled") acc.cancelled += Number(r.amount);
      return acc;
    },
    { total: 0, pending: 0, paid: 0, cancelled: 0 }
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Wallet className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Commissions affiliés</h1>
            <p className="text-sm text-muted-foreground">
              Reversements aux closers, influenceurs et promoteurs, retours et annulations.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-4">
          <Stat label="Total" value={totals.total} />
          <Stat label="En attente" value={totals.pending} />
          <Stat label="Payées" value={totals.paid} accent />
          <Stat label="Annulées" value={totals.cancelled} />
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Historique</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
            ) : rows.length === 0 ? (
              <p className="py-12 text-center text-sm text-muted-foreground">Aucune commission.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Bénéficiaire</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>%</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell className="text-xs">{new Date(r.created_at).toLocaleString("fr-CA")}</TableCell>
                      <TableCell className="font-mono text-xs">{r.beneficiary_user_id.slice(0, 8)}…</TableCell>
                      <TableCell><Badge variant="outline">{r.role}</Badge></TableCell>
                      <TableCell>{r.pct}%</TableCell>
                      <TableCell>
                        {Number(r.amount).toLocaleString("fr-CA", { style: "currency", currency: r.currency || "CAD" })}
                      </TableCell>
                      <TableCell><Badge variant={STATUS_VARIANT[r.status]}>{r.status}</Badge></TableCell>
                      <TableCell>
                        {r.status === "pending" && (
                          <div className="flex gap-1 justify-end">
                            <Button size="sm" variant="ghost" onClick={() => setStatus(r, "approved")}>
                              Approuver
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setStatus(r, "cancelled")}>
                              <XCircle className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        )}
                        {r.status === "approved" && (
                          <Button size="sm" variant="ghost" onClick={() => setStatus(r, "paid")}>
                            <CheckCircle2 className="h-4 w-4 text-success" /> Marquer payée
                          </Button>
                        )}
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

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <Card>
      <CardContent className="py-4">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold ${accent ? "text-primary" : ""}`}>
          {value.toLocaleString("fr-CA", { style: "currency", currency: "CAD" })}
        </p>
      </CardContent>
    </Card>
  );
}
