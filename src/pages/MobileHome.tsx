import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { requestNotificationPermission } from "@/lib/pwa";
import { Calendar, Heart, MessageSquare, Search, Plus, Bell, LogIn, Smartphone } from "lucide-react";
import { toast } from "sonner";

export default function MobileHome() {
  const { user } = useAuth();

  useEffect(() => {
    document.title = "Accueil — Boardeal";
  }, []);

  const handleEnableNotifications = async () => {
    const perm = await requestNotificationPermission();
    if (perm === "granted") toast.success("Notifications activées");
    else if (perm === "denied") toast.error("Notifications refusées dans le navigateur");
  };

  const tiles = [
    { to: "/mes-reservations", label: "Mes réservations", icon: Calendar, requireAuth: true },
    { to: "/favoris", label: "Favoris", icon: Heart, requireAuth: true },
    { to: "/messages", label: "Messages", icon: MessageSquare, requireAuth: true },
    { to: "/recherche", label: "Rechercher", icon: Search, requireAuth: false },
    { to: "/vendre", label: "Vendre", icon: Plus, requireAuth: true },
    { to: "/installer", label: "Installer l'app", icon: Smartphone, requireAuth: false },
  ];

  return (
    <div className="container max-w-2xl py-6 md:py-10">
      <header className="mb-6">
        <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl gradient-accent shadow-flash mb-3">
          <Smartphone className="h-7 w-7 text-accent-foreground" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold">
          {user ? `Bonjour 👋` : "Bienvenue sur Boardeal"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Le marketplace local du Québec, dans votre poche.
        </p>
      </header>

      {!user && (
        <Card className="p-4 mb-6 flex items-center justify-between gap-3">
          <div className="text-sm">
            <p className="font-semibold">Connectez-vous</p>
            <p className="text-muted-foreground">Pour accéder à vos réservations et favoris.</p>
          </div>
          <Button asChild size="sm">
            <Link to="/auth"><LogIn className="h-4 w-4 mr-1" />Connexion</Link>
          </Button>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 md:gap-4">
        {tiles.map(({ to, label, icon: Icon, requireAuth }) => {
          const target = requireAuth && !user ? "/auth" : to;
          return (
            <Link
              key={to}
              to={target}
              className="group rounded-2xl border bg-card p-4 hover:shadow-md transition-shadow active:scale-[0.98]"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-3">
                <Icon className="h-5 w-5" />
              </div>
              <p className="font-semibold text-sm">{label}</p>
            </Link>
          );
        })}
      </div>

      {user && (
        <Card className="p-4 mt-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Bell className="h-5 w-5 text-accent" />
              <div className="text-sm">
                <p className="font-semibold">Notifications de messages</p>
                <p className="text-muted-foreground text-xs">Soyez alerté en temps réel.</p>
              </div>
            </div>
            <Button size="sm" variant="outline" onClick={handleEnableNotifications}>
              Activer
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
