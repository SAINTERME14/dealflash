import { Link } from "react-router-dom";
import { useNotifications } from "@/hooks/useNotifications";
import { Button } from "@/components/ui/button";
import { Bell, Check, Trash2 } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { EnableNotificationsButton } from "./EnableNotificationsButton";

export function NotificationsBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead, remove } = useNotifications();

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notifications (${unreadCount} non lues)`}>
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge
              variant="destructive"
              className="absolute -top-1 -right-1 h-5 min-w-5 px-1 text-[10px] flex items-center justify-center"
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 bg-popover" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-7 text-xs">
              <Check className="h-3 w-3 mr-1" /> Tout marquer lu
            </Button>
          )}
        </div>
        <ScrollArea className="max-h-96">
          {notifications.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground py-8">Aucune notification</p>
          ) : (
            <ul className="divide-y">
              {notifications.map((n) => {
                const body = (
                  <>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium">{n.title}</p>
                      {!n.is_read && <span className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                    </div>
                    {n.message && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.message}</p>}
                    <p className="text-[10px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: fr })}
                    </p>
                  </>
                );
                return (
                  <li key={n.id} className="group relative">
                    {n.link ? (
                      <Link
                        to={n.link}
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className="block p-3 hover:bg-muted transition-colors pr-10"
                      >
                        {body}
                      </Link>
                    ) : (
                      <button
                        onClick={() => !n.is_read && markAsRead(n.id)}
                        className="block w-full text-left p-3 hover:bg-muted transition-colors pr-10"
                      >
                        {body}
                      </button>
                    )}
                    <button
                      onClick={() => remove(n.id)}
                      className="absolute top-3 right-2 opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-destructive transition-opacity"
                      aria-label="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </ScrollArea>
        <EnableNotificationsButton />
      </PopoverContent>
    </Popover>
  );
}
