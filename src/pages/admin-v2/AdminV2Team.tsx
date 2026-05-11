import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sb } from "@/integrations/supabase/untyped";
import { useAdminUser, type AdminRole } from "@/hooks/useAdminUser";
import { logAdminAction } from "@/lib/adminAudit";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Loader2, ShieldCheck, ShieldAlert, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

const ROLES: AdminRole[] = ["super_admin", "admin", "moderator", "support", "marketing", "accountant", "hr", "analyst"];
const ROLE_COLORS: Record<AdminRole, string> = {
  super_admin: "bg-orange-500 text-white",
  admin: "bg-blue-600 text-white",
  moderator: "bg-purple-600 text-white",
  support: "bg-cyan-600 text-white",
  marketing: "bg-pink-600 text-white",
  accountant: "bg-emerald-600 text-white",
  hr: "bg-amber-600 text-white",
  analyst: "bg-slate-600 text-white",
};

type Row = {
  id: string; user_id: string; role: AdminRole; is_active: boolean;
  two_fa_enabled: boolean; last_login_at: string | null; notes: string | null;
  created_at: string;
};

export default function AdminV2Team() {
  const { admin, isSuperAdmin, loading: meLoading } = useAdminUser();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [profiles, setProfiles] = useState<Record<string, { display_name: string | null; avatar_url: string | null }>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  // invite
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<AdminRole>("support");
  const [inviteNote, setInviteNote] = useState("");
  const [inviting, setInviting] = useState(false);

  useEffect(() => {
    document.title = "Équipe & rôles · Admin";
    if (!meLoading && !isSuperAdmin) {
      toast.error("Accès non autorisé");
      navigate("/admin/v2");
    }
  }, [meLoading, isSuperAdmin, navigate]);

  async function load() {
    setLoading(true);
    const { data, error } = await sb.from("admin_users")
      .select("id, user_id, role, is_active, two_fa_enabled, last_login_at, notes, created_at")
      .order("created_at", { ascending: false });
    if (error) toast.error("Erreur chargement", { description: error.message });
    const list = (data as Row[]) ?? [];
    setRows(list);

    if (list.length) {
      const ids = list.map((r) => r.user_id);
      const { data: profs } = await sb.from("profiles")
        .select("user_id, display_name, avatar_url").in("user_id", ids);
      const map: typeof profiles = {};
      (profs ?? []).forEach((p: { user_id: string; display_name: string | null; avatar_url: string | null }) => {
        map[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url };
      });
      setProfiles(map);
    }
    setLoading(false);
  }

  useEffect(() => { if (isSuperAdmin) load(); }, [isSuperAdmin]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filterRole !== "all" && r.role !== filterRole) return false;
      if (filterStatus === "active" && !r.is_active) return false;
      if (filterStatus === "inactive" && r.is_active) return false;
      if (search) {
        const q = search.toLowerCase();
        const name = (profiles[r.user_id]?.display_name ?? "").toLowerCase();
        if (!name.includes(q) && !r.user_id.includes(q)) return false;
      }
      return true;
    });
  }, [rows, filterRole, filterStatus, search, profiles]);

  async function invite() {
    setInviting(true);
    // Vérifier que l'email correspond à un profil existant
    const { data: prof } = await sb.from("profiles")
      .select("user_id, display_name").ilike("display_name", inviteEmail.split("@")[0]).limit(1);
    // On essaie aussi par lookup direct via auth: pas accessible côté client.
    // Approche pragmatique : demander à entrer l'user_id. Pour cette V1, on demande l'user_id directement.
    if (!prof || prof.length === 0) {
      toast.error("Utilisateur introuvable", {
        description: "Cet utilisateur doit d'abord créer un compte sur Boardeal. Astuce : utilisez son user_id complet.",
      });
      setInviting(false);
      return;
    }
    const userId = prof[0].user_id;
    const { error } = await sb.from("admin_users").insert({
      user_id: userId, role: inviteRole, notes: inviteNote || null,
      created_by: admin?.user_id,
    });
    if (error) {
      toast.error("Échec invitation", { description: error.message });
      setInviting(false);
      return;
    }
    await logAdminAction({
      actionType: "admin.created",
      targetType: "admin_users", targetId: userId,
      afterState: { role: inviteRole, notes: inviteNote },
    });
    toast.success("Admin ajouté");
    setInviteOpen(false);
    setInviteEmail(""); setInviteNote(""); setInviteRole("support");
    setInviting(false);
    load();
  }

  async function toggleActive(row: Row) {
    if (row.user_id === admin?.user_id) {
      toast.error("Impossible de se désactiver soi-même");
      return;
    }
    const next = !row.is_active;
    const { error } = await sb.from("admin_users")
      .update({ is_active: next, deactivated_at: next ? null : new Date().toISOString() })
      .eq("id", row.id);
    if (error) return toast.error(error.message);
    await logAdminAction({
      actionType: next ? "admin.reactivated" : "admin.deactivated",
      targetType: "admin_users", targetId: row.user_id,
      beforeState: { is_active: row.is_active }, afterState: { is_active: next },
    });
    toast.success(next ? "Admin réactivé" : "Admin désactivé");
    load();
  }

  async function changeRole(row: Row, role: AdminRole) {
    if (row.user_id === admin?.user_id) {
      toast.error("Vous ne pouvez pas changer votre propre rôle");
      return;
    }
    const { error } = await sb.from("admin_users").update({ role }).eq("id", row.id);
    if (error) return toast.error(error.message);
    await logAdminAction({
      actionType: "admin.role_changed", targetType: "admin_users", targetId: row.user_id,
      beforeState: { role: row.role }, afterState: { role },
    });
    toast.success("Rôle modifié");
    load();
  }

  async function forceLogout(row: Row) {
    const { error } = await sb.from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("admin_id", row.id).is("revoked_at", null);
    if (error) return toast.error(error.message);
    await logAdminAction({
      actionType: "admin.force_logout", targetType: "admin_users", targetId: row.user_id,
    });
    toast.success("Sessions révoquées");
  }

  if (meLoading || !isSuperAdmin) {
    return <div className="flex justify-center py-20"><Loader2 className="h-6 w-6 animate-spin" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold">Équipe & rôles admin</h1>
          <p className="text-sm text-muted-foreground">Gérez les administrateurs et leurs permissions.</p>
        </div>
        <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
          <DialogTrigger asChild>
            <Button><UserPlus className="h-4 w-4 mr-2" /> Inviter un admin</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Inviter un administrateur</DialogTitle>
              <DialogDescription>L'utilisateur doit déjà avoir un compte Boardeal.</DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Identifiant utilisateur (email ou nom)</Label>
                <Input value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="prenom.nom" />
                <p className="text-[11px] text-muted-foreground">Recherche dans les profils par nom d'affichage.</p>
              </div>
              <div className="space-y-1">
                <Label>Rôle</Label>
                <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as AdminRole)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Note interne</Label>
                <Textarea value={inviteNote} onChange={(e) => setInviteNote(e.target.value)} rows={2} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteOpen(false)}>Annuler</Button>
              <Button onClick={invite} disabled={inviting || !inviteEmail}>
                {inviting && <Loader2 className="h-4 w-4 animate-spin mr-2" />} Inviter
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-3 grid sm:grid-cols-3 gap-2">
          <Input placeholder="Rechercher…" value={search} onChange={(e) => setSearch(e.target.value)} />
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger><SelectValue placeholder="Rôle" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les rôles</SelectItem>
              {ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous statuts</SelectItem>
              <SelectItem value="active">Actifs</SelectItem>
              <SelectItem value="inactive">Désactivés</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Admin</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead>Dernière connexion</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-sm">{profiles[r.user_id]?.display_name ?? "(sans nom)"}</p>
                      <p className="text-[10px] font-mono text-muted-foreground">{r.user_id.slice(0, 8)}…</p>
                    </TableCell>
                    <TableCell>
                      <Select value={r.role} onValueChange={(v) => changeRole(r, v as AdminRole)} disabled={r.user_id === admin?.user_id}>
                        <SelectTrigger className="h-7 w-32 text-xs">
                          <Badge className={`${ROLE_COLORS[r.role]} text-[10px]`}>{r.role}</Badge>
                        </SelectTrigger>
                        <SelectContent>
                          {ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      {r.two_fa_enabled
                        ? <ShieldCheck className="h-4 w-4 text-emerald-600" />
                        : <ShieldAlert className="h-4 w-4 text-orange-500" />}
                    </TableCell>
                    <TableCell className="text-xs">
                      {r.last_login_at ? formatDistanceToNow(new Date(r.last_login_at), { addSuffix: true, locale: fr }) : "Jamais"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={r.is_active ? "default" : "outline"} className="text-[10px]">
                        {r.is_active ? "Actif" : "Désactivé"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => forceLogout(r)}>
                          Forcer logout
                        </Button>
                        <Button size="sm" variant={r.is_active ? "destructive" : "default"}
                          className="h-7 text-xs" onClick={() => toggleActive(r)}
                          disabled={r.user_id === admin?.user_id}>
                          {r.is_active ? "Désactiver" : "Réactiver"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <details className="border rounded-md p-4">
        <summary className="cursor-pointer font-medium text-sm">Tableau de référence des rôles</summary>
        <div className="mt-3 overflow-x-auto">
          <table className="text-xs w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">Module</th>
                {ROLES.map((r) => <th key={r} className="p-1">{r}</th>)}
              </tr>
            </thead>
            <tbody>
              {[
                ["Pilotage", "L+E", "L+E", "L", "L", "L", "L", "L", "L"],
                ["Marketplace", "L+E", "L+E", "L+E", "L", "—", "—", "—", "L"],
                ["Utilisateurs", "L+E", "L+E", "L+E", "L", "—", "—", "—", "L"],
                ["Comptabilité", "L+E", "L", "—", "—", "—", "L+E", "—", "L"],
                ["Marketing", "L+E", "L+E", "—", "—", "L+E", "—", "—", "L"],
                ["RH", "L+E", "—", "—", "—", "—", "—", "L+E", "—"],
                ["Système", "L+E", "L", "—", "—", "—", "—", "—", "—"],
              ].map((row, i) => (
                <tr key={i} className="border-b">
                  {row.map((c, j) => <td key={j} className={`p-1 ${j === 0 ? "font-medium" : "text-center"}`}>{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
