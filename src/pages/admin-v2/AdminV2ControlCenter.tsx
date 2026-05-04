import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAdminUser } from "@/hooks/useAdminUser";
import { useSystemConfig } from "@/hooks/useSystemConfig";
import { logAdminAction } from "@/lib/adminAudit";
import { CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

const SERVICES = [
  { name: "Site public", status: "ok" },
  { name: "API Backend", status: "ok" },
  { name: "Storage", status: "ok" },
  { name: "Emails", status: "ok" },
  { name: "Database", status: "ok" },
];

export default function AdminV2ControlCenter() {
  const { isSuperAdmin } = useAdminUser();
  const maintenance = useSystemConfig<{ enabled: boolean; message: string | null }>("maintenance_mode");
  const signup = useSystemConfig<{ enabled: boolean }>("signup_enabled");
  const listings = useSystemConfig<{ enabled: boolean }>("listing_creation_enabled");
  const [msg, setMsg] = useState("");
  useEffect(() => { setMsg(maintenance.value?.message ?? ""); }, [maintenance.value]);
  useEffect(() => { document.title = "Centre de contrôle · Admin"; }, []);

  async function toggleMaintenance(enabled: boolean) {
    const before = maintenance.value;
    const next = { enabled, message: msg || null };
    const { error } = await maintenance.update(next);
    if (error) return toast.error("Erreur", { description: error.message });
    await logAdminAction({
      actionType: "config.maintenance_mode_toggled",
      targetType: "system_config", targetId: "maintenance_mode",
      beforeState: before ?? undefined, afterState: next,
    });
    toast.success(enabled ? "Mode maintenance activé" : "Mode maintenance désactivé");
  }
  async function saveMessage() {
    const before = maintenance.value;
    const next = { enabled: maintenance.value?.enabled ?? false, message: msg || null };
    const { error } = await maintenance.update(next);
    if (error) return toast.error(error.message);
    await logAdminAction({ actionType: "config.maintenance_message_updated", beforeState: before ?? undefined, afterState: next });
    toast.success("Message mis à jour");
  }
  async function toggleConfig(key: "signup_enabled" | "listing_creation_enabled", current: boolean) {
    const cfg = key === "signup_enabled" ? signup : listings;
    const next = { enabled: !current };
    const { error } = await cfg.update(next);
    if (error) return toast.error(error.message);
    await logAdminAction({ actionType: `config.${key}_toggled`, afterState: next });
    toast.success("Configuration mise à jour");
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold">Centre de contrôle</h1>
        <p className="text-sm text-muted-foreground">État du système et toggles globaux.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">État du système</CardTitle></CardHeader>
        <CardContent className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {SERVICES.map((s) => (
            <div key={s.name} className="border rounded p-3 text-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500 mx-auto mb-1" />
              <p className="text-sm font-medium">{s.name}</p>
              <p className="text-[10px] text-muted-foreground mt-1">Opérationnel</p>
            </div>
          ))}
        </CardContent>
      </Card>

      {isSuperAdmin && (
        <Card>
          <CardHeader><CardTitle className="text-base">Mode maintenance</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Activer le mode maintenance</Label>
              <Switch checked={!!maintenance.value?.enabled} onCheckedChange={toggleMaintenance} />
            </div>
            <div className="space-y-1">
              <Label>Message à afficher</Label>
              <div className="flex gap-2">
                <Input value={msg} onChange={(e) => setMsg(e.target.value)} placeholder="Nous serons de retour à 22h" />
                <Button onClick={saveMessage} variant="outline">Enregistrer</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Toggles globaux</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Inscriptions ouvertes</Label>
            <Switch checked={!!signup.value?.enabled} onCheckedChange={() => toggleConfig("signup_enabled", !!signup.value?.enabled)} disabled={!isSuperAdmin} />
          </div>
          <div className="flex items-center justify-between">
            <Label>Création d'annonces autorisée</Label>
            <Switch checked={!!listings.value?.enabled} onCheckedChange={() => toggleConfig("listing_creation_enabled", !!listings.value?.enabled)} disabled={!isSuperAdmin} />
          </div>
          {!isSuperAdmin && <p className="text-xs text-muted-foreground">Modifications réservées au super-admin.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
