import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Loader2, Users } from "lucide-react";

type Lead = {
  id: string;
  status: "scanned" | "converted" | "cancelled";
  scanned_at: string;
  amount_cents: number | null;
  currency: string | null;
  channel: string | null;
};

export function AffiliateLeadsPanel() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("leads")
        .select("id, status, scanned_at, amount_cents, currency, channel")
        .eq("affiliate_user_id", user.id)
        .order("scanned_at", { ascending: false })
        .limit(50);
      setLeads((data as Lead[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const converted = leads.filter((l) => l.status === "converted").length;
  const total = leads.length;
  const rate = total ? Math.round((converted / total) * 100) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Mes leads ({total} · {rate}% conversion)
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="py-8 flex justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : leads.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Aucun lead pour l'instant. Partagez vos QR pour générer des opportunités.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Montant</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="text-xs">
                    {new Date(l.scanned_at).toLocaleDateString("fr-CA")}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{l.channel ?? "—"}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        l.status === "converted"
                          ? "default"
                          : l.status === "cancelled"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {l.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {l.amount_cents != null
                      ? (l.amount_cents / 100).toLocaleString("fr-CA", {
                          style: "currency",
                          currency: l.currency || "CAD",
                        })
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
