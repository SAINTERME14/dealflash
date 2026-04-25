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
import { History, Loader2, Search } from "lucide-react";

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

const ACTION_COLORS: Record<string, string> = {
  enabled: "bg-success text-success-foreground",
  disabled: "bg-destructive/20 text-destructive",
  renewed: "bg-primary/10 text-primary",
  priority_changed: "bg-secondary text-secondary-foreground",
  updated: "bg-muted text-muted-foreground",
};

const ACTIONS = ["all", "enabled", "disabled", "renewed", "priority_changed"] as const;
type Filter = typeof ACTIONS[number];

export default function AdminAuditLog() {
  const [rows, setRows] = useState<LogRow[]>([]);
  const [titles, setTitles] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => {
    document.title = "Admin · Journal | DealFlash";
  }, []);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== "all" && r.action !== filter) return false;
      if (!q) return true;
      return (titles[r.listing_id] ?? "").toLowerCase().includes(q);
    });
  }, [rows, search, filter, titles]);

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <History className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Journal d'audit</h1>
            <p className="text-sm text-muted-foreground">
              Historique complet des changements de boost vedette.
            </p>
          </div>
        </div>

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
      </div>
    </AdminLayout>
  );
}
