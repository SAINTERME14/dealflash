import { useEffect, useState } from "react";
import { sb } from "@/integrations/supabase/untyped";
import { useAdminUser } from "@/hooks/useAdminUser";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Loader2, Download, Search } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Log = {
  id: number; admin_id: string; action_type: string;
  target_type: string | null; target_id: string | null;
  before_state: unknown; after_state: unknown;
  note: string | null; ip_address: string | null;
  user_agent: string | null; created_at: string;
};

const PAGE = 50;

export default function AdminV2Audit() {
  const { isSuperAdmin } = useAdminUser();
  const [rows, setRows] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Log | null>(null);

  useEffect(() => { document.title = "Journal d'audit · Admin"; }, []);

  async function load() {
    setLoading(true);
    let q = sb.from("audit_logs").select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(page * PAGE, page * PAGE + PAGE - 1);
    if (filterAction) q = q.ilike("action_type", `%${filterAction}%`);
    if (search) q = q.or(`target_id.ilike.%${search}%,note.ilike.%${search}%`);
    const { data } = await q;
    setRows((data as Log[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [page, search, filterAction]);

  function exportCsv() {
    const csv = [
      ["created_at", "admin_id", "action_type", "target_type", "target_id", "ip", "note"].join(","),
      ...rows.map((r) => [
        r.created_at, r.admin_id, r.action_type, r.target_type ?? "",
        r.target_id ?? "", r.ip_address ?? "", (r.note ?? "").replace(/"/g, '""'),
      ].map((v) => `"${v}"`).join(",")),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Journal d'audit</h1>
          <p className="text-sm text-muted-foreground">
            {isSuperAdmin ? "Vue complète — toutes les actions" : "Vos actions uniquement"}
          </p>
        </div>
        {isSuperAdmin && (
          <Button variant="outline" onClick={exportCsv}>
            <Download className="h-4 w-4 mr-2" /> Exporter CSV
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-3 grid sm:grid-cols-2 gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-8" placeholder="Recherche par target ID ou note" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Input placeholder="Type d'action (ex: admin.login)" value={filterAction} onChange={(e) => setFilterAction(e.target.value)} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : rows.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Aucune entrée</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Cible</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>IP</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id} className="cursor-pointer" onClick={() => setSelected(r)}>
                    <TableCell className="text-xs" title={r.created_at}>
                      {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: fr })}
                    </TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px]">{r.action_type}</Badge></TableCell>
                    <TableCell className="text-xs">
                      {r.target_type ? <>{r.target_type} <span className="font-mono">{r.target_id?.slice(0, 8)}</span></> : "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-xs truncate">{r.note ?? "—"}</TableCell>
                    <TableCell className="text-xs font-mono">{r.ip_address ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center">
        <Button variant="outline" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Précédent</Button>
        <span className="text-sm text-muted-foreground">Page {page + 1}</span>
        <Button variant="outline" disabled={rows.length < PAGE} onClick={() => setPage((p) => p + 1)}>Suivant →</Button>
      </div>

      <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Détail du log #{selected?.id}</DialogTitle></DialogHeader>
          {selected && (
            <div className="space-y-3 text-sm">
              <div><span className="font-semibold">Date :</span> {selected.created_at}</div>
              <div><span className="font-semibold">Action :</span> {selected.action_type}</div>
              <div><span className="font-semibold">Cible :</span> {selected.target_type} / {selected.target_id ?? "—"}</div>
              <div><span className="font-semibold">IP :</span> {selected.ip_address ?? "—"}</div>
              <div><span className="font-semibold">User-Agent :</span> <span className="text-xs break-all">{selected.user_agent ?? "—"}</span></div>
              <div><span className="font-semibold">Note :</span> {selected.note ?? "—"}</div>
              <div className="grid sm:grid-cols-2 gap-3 pt-2">
                <div>
                  <p className="font-semibold mb-1">Avant</p>
                  <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-60">{JSON.stringify(selected.before_state, null, 2) || "—"}</pre>
                </div>
                <div>
                  <p className="font-semibold mb-1">Après</p>
                  <pre className="text-[10px] bg-muted p-2 rounded overflow-auto max-h-60">{JSON.stringify(selected.after_state, null, 2) || "—"}</pre>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
