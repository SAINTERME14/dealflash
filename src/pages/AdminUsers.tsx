import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Crown, Loader2, Search, ShieldCheck, Trash2 } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useIsSuperAdmin } from "@/hooks/useIsSuperAdmin";

type Role = "admin" | "vendeur_b2c" | "vendeur_c2c" | "acheteur";
const ALL_ROLES: Role[] = ["admin", "vendeur_b2c", "vendeur_c2c", "acheteur"];

type ProfileRow = {
  user_id: string;
  display_name: string | null;
  city: string | null;
  is_verified: boolean;
  created_at: string;
};

type RoleRow = {
  user_id: string;
  role: Role;
};

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [superAdminIds, setSuperAdminIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const { isSuperAdmin } = useIsSuperAdmin();

  useEffect(() => {
    document.title = "Admin · Utilisateurs | DealFlash";
  }, []);

  async function load() {
    setLoading(true);
    const [pRes, rRes, sRes] = await Promise.all([
      supabase
        .from("profiles")
        .select("user_id, display_name, city, is_verified, created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("super_admins").select("user_id"),
    ]);
    if (pRes.error) toast.error("Erreur profils", { description: pRes.error.message });
    if (rRes.error) toast.error("Erreur rôles", { description: rRes.error.message });
    setProfiles((pRes.data ?? []) as ProfileRow[]);
    setRoles((rRes.data ?? []) as RoleRow[]);
    setSuperAdminIds(new Set((sRes.data ?? []).map((s: { user_id: string }) => s.user_id)));
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const rolesByUser = useMemo(() => {
    const map = new Map<string, Set<Role>>();
    for (const r of roles) {
      if (!map.has(r.user_id)) map.set(r.user_id, new Set());
      map.get(r.user_id)!.add(r.role);
    }
    return map;
  }, [roles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(
      (p) =>
        (p.display_name ?? "").toLowerCase().includes(q) ||
        (p.city ?? "").toLowerCase().includes(q) ||
        p.user_id.includes(q)
    );
  }, [profiles, search]);

  async function addRole(userId: string, role: Role) {
    setBusy(userId + role);
    const { error } = await supabase.from("user_roles").insert({ user_id: userId, role });
    if (error) toast.error("Ajout impossible", { description: error.message });
    else toast.success(`Rôle « ${role} » ajouté`);
    setBusy(null);
    load();
  }

  async function removeRole(userId: string, role: Role) {
    setBusy(userId + role);
    const { error } = await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", role);
    if (error) toast.error("Retrait impossible", { description: error.message });
    else toast.success(`Rôle « ${role} » retiré`);
    setBusy(null);
    load();
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <ShieldCheck className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Utilisateurs &amp; rôles</h1>
            <p className="text-sm text-muted-foreground">
              Attribuez ou retirez les rôles (admin, vendeur, acheteur).
            </p>
          </div>
        </div>

        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Nom, ville ou identifiant…"
                className="pl-9"
              />
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
                Aucun utilisateur trouvé.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Ville</TableHead>
                    <TableHead>Rôles actuels</TableHead>
                    <TableHead className="text-right">Ajouter un rôle</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((p) => {
                    const userRoles = rolesByUser.get(p.user_id) ?? new Set<Role>();
                    return (
                      <TableRow key={p.user_id}>
                        <TableCell>
                          <div className="font-medium">
                            {p.display_name ?? "(sans nom)"}
                            {p.is_verified && (
                              <Badge className="ml-2 text-[10px] bg-success text-success-foreground">
                                Vérifié
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground font-mono">
                            {p.user_id.slice(0, 8)}…
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{p.city ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1.5">
                            {[...userRoles].length === 0 ? (
                              <span className="text-xs text-muted-foreground">Aucun</span>
                            ) : (
                              [...userRoles].map((r) => (
                                <RoleChip
                                  key={r}
                                  role={r}
                                  busy={busy === p.user_id + r}
                                  onRemove={() => removeRole(p.user_id, r)}
                                />
                              ))
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end flex-wrap gap-1">
                            {ALL_ROLES.filter((r) => !userRoles.has(r)).map((r) => (
                              <Button
                                key={r}
                                size="sm"
                                variant="outline"
                                onClick={() => addRole(p.user_id, r)}
                                disabled={busy === p.user_id + r}
                                className="h-7 text-xs"
                              >
                                + {r}
                              </Button>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

function RoleChip({
  role, busy, onRemove,
}: { role: Role; busy: boolean; onRemove: () => void }) {
  const isAdmin = role === "admin";
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border transition ${
            isAdmin
              ? "bg-primary/10 text-primary border-primary/20"
              : "bg-secondary text-secondary-foreground border-border"
          } hover:opacity-80`}
          disabled={busy}
        >
          {role}
          {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Retirer le rôle « {role} » ?</AlertDialogTitle>
          <AlertDialogDescription>
            {isAdmin
              ? "Attention : cet utilisateur perdra immédiatement son accès admin."
              : "L'utilisateur perdra les permissions associées à ce rôle."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={onRemove}>Confirmer</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
