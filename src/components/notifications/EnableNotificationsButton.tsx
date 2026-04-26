import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff, BellRing } from "lucide-react";
import { requestNotificationPermission } from "@/lib/pwa";
import { toast } from "sonner";

/** Button to enable browser notifications (used inside the bell popover). */
export function EnableNotificationsButton() {
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  if (permission === "unsupported") return null;

  if (permission === "granted") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 border-t">
        <BellRing className="h-3.5 w-3.5 text-primary" />
        Notifications activées
      </div>
    );
  }

  if (permission === "denied") {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground px-3 py-2 border-t">
        <BellOff className="h-3.5 w-3.5" />
        Notifications bloquées (réglages navigateur)
      </div>
    );
  }

  const handleEnable = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === "granted") {
      toast.success("Notifications activées");
      try {
        new Notification("DealFlash", {
          body: "Vous recevrez maintenant les alertes en temps réel.",
          icon: "/icon-192.png",
        });
      } catch {
        // ignore
      }
    } else if (result === "denied") {
      toast.error("Notifications refusées");
    }
  };

  return (
    <div className="border-t p-2">
      <Button
        onClick={handleEnable}
        size="sm"
        variant="outline"
        className="w-full justify-start text-xs"
      >
        <Bell className="h-3.5 w-3.5 mr-2" />
        Activer les notifications navigateur
      </Button>
    </div>
  );
}
