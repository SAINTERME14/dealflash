import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, MessageSquare } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Row = {
  id: string; subject: string; status: string; priority: string; category: string;
  created_at: string; updated_at: string; user_id: string;
};

const STATUSES = ["all", "open", "in_progress", "waiting_user", "resolved", "closed"];

export default function AdminSupport() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { document.title = "Admin · Support | Boardeal"; }, []);

  const load = async () => {
    setLoading(true);
    let q = supabase.from("support_tickets").select("*").order("updated_at", { ascending: false });
    if (filter !== "all") q = q.eq("status", filter as "open" | "in_progress" | "waiting_user" | "resolved" | "closed");
    const { data } = await q;
    setRows((data as Row[]) ?? []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [filter]);

  return (
    <AdminLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Support utilisateurs</h1>
            <p className="text-sm text-muted-foreground">Tickets reçus de la part des utilisateurs.</p>
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="open">Ouvert</SelectItem>
              <SelectItem value="in_progress">En cours</SelectItem>
              <SelectItem value="waiting_user">En attente user</SelectItem>
              <SelectItem value="resolved">Résolu</SelectItem>
              <SelectItem value="closed">Fermé</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-12 text-center">
            <MessageSquare className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Aucun ticket.</p>
          </CardContent></Card>
        ) : (
          <div className="space-y-2">
            {rows.map((t) => (
              <Card key={t.id} className="hover:shadow-md transition-shadow">
                <Link to={`/support/${t.id}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-3">
                      <CardTitle className="text-base">{t.subject}</CardTitle>
                      <div className="flex gap-1">
                        <Badge variant="outline">{t.priority}</Badge>
                        <Badge>{t.status}</Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t.category} · MAJ {formatDistanceToNow(new Date(t.updated_at), { addSuffix: true, locale: fr })}
                    </p>
                  </CardHeader>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
