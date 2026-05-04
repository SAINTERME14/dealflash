import { useEffect, useState } from "react";
import { sb } from "@/integrations/supabase/untyped";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { logAdminAction } from "@/lib/adminAudit";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";

type Session = {
  id: string; admin_id: string; ip_address: string | null;
  user_agent: string | null; two_fa_verified: boolean;
  expires_at: string; created_at: string;
};

export default function AdminV2Security() {
  const { isSuperAdmin } = useAdminUser();
  const require2fa = useSystemConfig<{ enabled: boolean }>("require_2fa_non_super_admin");
  const sessionDuration = useSystemConfig<{ hours: number }>("session_duration_hours");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { document.title = "Sécurité & sessions · Admin"; }, []);

  async function load() {
    setLoading(true);
    const { data } = await sb.from("admin_sessions")
      .select("*").is("revoked_at", null).gt("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false });
    setSessions((data as Session[]) ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function revoke(id: string) {
    const { error } = await sb.from("admin_sessions")
      .update({ revoked_at: new Date().toISOString() }).eq("id", id);
    if (error) return toast.error(error.message);
    await logAdminAction({ actionType: "session.revoked", targetType: "admin_sessions", targetId: id });
    toast.success("Session révoquée");
    load();
  }

  async function revokeAll() {
    const { data, error } = await sb.rpc("revoke_all_admin_sessions");
    if (error) return toast.error(error.message);
    await logAdminAction({ actionType: "session.revoke_all", note: `${data} sessions révoquées` });
    toast.success(`${data} session(s) révoquée(s)`);
    load();
  }

  async function toggle2fa(enabled: boolean) {
    const { error } = await require2fa.update({ enabled });
    if (error) return toast.error(error.message);
    await logAdminAction({ actionType: "config.require_2fa_toggled", afterState: { enabled } });
    toast.success("Réglage mis à jour");
  }

  async function setDuration(hours: number) {
    const { error } = await sessionDuration.update({ hours });
    if (error) return toast.error(error.message);
    await logAdminAction({ actionType: "config.session_duration_updated", afterState: { hours } });
    toast.success("Durée mise à jour");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Sécurité & sessions</h1>
        <p className="text-sm text-muted-foreground">Gestion des sessions admin et de la politique de sécurité.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Sessions actives ({sessions.length})</CardTitle>
          {isSuperAdmin && sessions.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">Révoquer toutes</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Révoquer toutes les sessions ?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tous les administrateurs seront déconnectés et devront se reconnecter.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuler</AlertDialogCancel>
                  <AlertDialogAction onClick={revokeAll}>Confirmer</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-8 flex justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div>
          ) : sessions.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">Aucune session active</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>IP</TableHead>
                  <TableHead>User-Agent</TableHead>
                  <TableHead>Créée</TableHead>
                  <TableHead>Expire</TableHead>
                  <TableHead>2FA</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sessions.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="font-mono text-xs">{s.ip_address ?? "—"}</TableCell>
                    <TableCell className="text-xs max-w-xs truncate" title={s.user_agent ?? ""}>{s.user_agent?.slice(0, 40) ?? "—"}</TableCell>
                    <TableCell className="text-xs">{formatDistanceToNow(new Date(s.created_at), { addSuffix: true, locale: fr })}</TableCell>
                    <TableCell className="text-xs">{formatDistanceToNow(new Date(s.expires_at), { addSuffix: true, locale: fr })}</TableCell>
                    <TableCell>{s.two_fa_verified ? "✓" : "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" variant="outline" onClick={() => revoke(s.id)} className="h-7 text-xs">Révoquer</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card>
          <CardHeader><CardTitle className="text-base">Configuration sécurité</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>2FA obligatoire (sauf super_admin)</Label>
                <p className="text-xs text-muted-foreground">Force tous les autres rôles à activer le 2FA.</p>
              </div>
              <Switch checked={!!require2fa.value?.enabled} onCheckedChange={toggle2fa} />
            </div>

            <div className="flex items-center justify-between">
              <Label>Durée des sessions</Label>
              <Select value={String(sessionDuration.value?.hours ?? 4)} onValueChange={(v) => setDuration(Number(v))}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 heure</SelectItem>
                  <SelectItem value="4">4 heures</SelectItem>
                  <SelectItem value="8">8 heures</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between opacity-60">
              <Label>Liste blanche d'adresses IP</Label>
              <Badge variant="outline">Bientôt</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
