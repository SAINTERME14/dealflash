import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { showLocalNotification } from "@/lib/pwa";
import { toast } from "sonner";

/**
 * Subscribes to realtime inserts on `messages` for the current user
 * and triggers a local browser notification + toast for each new message.
 */
export function useMessageNotifications() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`messages:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const msg = payload.new as { content?: string };
          const preview = (msg.content ?? "").slice(0, 80);
          showLocalNotification("Nouveau message — DealFlash", {
            body: preview,
            tag: "dealflash-message",
          });
          toast("Nouveau message", { description: preview });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);
}
