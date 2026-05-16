import { useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { ToggleLeft } from "lucide-react";
import { toast } from "sonner";
import { setFeatureFlag, useAllFeatureFlags } from "@/hooks/useFeatureFlag";

const LABELS: Record<string, string> = {
  tickets_enabled: "Logique de tickets (réservations payantes)",
  leads_enabled: "Logique de leads via QR de rabais",
};

export default function AdminFeatureFlags() {
  useEffect(() => {
    document.title = "Admin · Fonctionnalités | Boardeal";
  }, []);
  const flags = useAllFeatureFlags();

  const toggle = async (key: string, value: boolean) => {
    try {
      await setFeatureFlag(key, value);
      toast.success(`${LABELS[key] ?? key} : ${value ? "activé" : "désactivé"}`);
    } catch (e) {
      toast.error("Échec de la mise à jour");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-3xl">
        <div className="flex items-center gap-3">
          <ToggleLeft className="h-6 w-6 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Drapeaux de fonctionnalités</h1>
            <p className="text-sm text-muted-foreground">
              Active ou désactive des modules de la plateforme à la volée.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Modules</CardTitle>
          </CardHeader>
          <CardContent className="divide-y">
            {flags.length === 0 && (
              <p className="text-sm text-muted-foreground py-4">Chargement…</p>
            )}
            {flags.map((f) => (
              <div
                key={f.key}
                className="flex items-center justify-between py-4"
              >
                <div>
                  <p className="font-medium">{LABELS[f.key] ?? f.key}</p>
                  <p className="text-xs text-muted-foreground font-mono">
                    {f.key}
                  </p>
                </div>
                <Switch
                  checked={f.enabled}
                  onCheckedChange={(v) => toggle(f.key, v)}
                />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
