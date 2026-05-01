import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Calendar, Heart, MessageCircle, Plus, TrendingUp, Star, BarChart3 } from "lucide-react";
import { MyAdvertiserApplications } from "@/components/dashboard/MyAdvertiserApplications";

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ listings: 0, bookingsAsBuyer: 0, bookingsAsSeller: 0, favorites: 0 });

  useEffect(() => {
    document.title = "Tableau de bord — DealFlash";
    if (!user) return;
    (async () => {
      const [l, bb, bs, f] = await Promise.all([
        supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("buyer_id", user.id),
        supabase.from("bookings").select("id", { count: "exact", head: true }).eq("seller_id", user.id),
        supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      ]);
      setStats({
        listings: l.count ?? 0,
        bookingsAsBuyer: bb.count ?? 0,
        bookingsAsSeller: bs.count ?? 0,
        favorites: f.count ?? 0,
      });
    })();
  }, [user]);

  const cards = [
    { label: "Mes annonces", value: stats.listings, icon: Package, to: "/mes-annonces", color: "gradient-primary" },
    { label: "Mes réservations", value: stats.bookingsAsBuyer, icon: Calendar, to: "/mes-reservations", color: "gradient-accent" },
    { label: "Demandes reçues", value: stats.bookingsAsSeller, icon: TrendingUp, to: "/mes-annonces", color: "bg-success" },
    { label: "Mes favoris", value: stats.favorites, icon: Heart, to: "/favoris", color: "bg-warning" },
  ];

  return (
    <div className="container py-8">
      <div className="flex items-start justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Tableau de bord</h1>
          <p className="text-muted-foreground mt-1">Bienvenue {user?.email}</p>
        </div>
        <Button asChild variant="hero" size="lg">
          <Link to="/vendre"><Plus className="h-4 w-4" /> Nouvelle annonce</Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {cards.map((c) => (
          <Link key={c.label} to={c.to}>
            <Card className="p-5 hover:shadow-elevated transition-smooth hover:-translate-y-1">
              <div className={`h-10 w-10 rounded-lg ${c.color} flex items-center justify-center text-primary-foreground mb-3`}>
                <c.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.label}</p>
            </Card>
          </Link>
        ))}
      </div>

      <MyAdvertiserApplications />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><Package className="h-4 w-4" /> Vendre</h2>
          <p className="text-sm text-muted-foreground mb-4">Publiez de nouvelles annonces et gérez celles qui sont en ligne.</p>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="default" size="sm"><Link to="/vendre">Publier</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/mes-annonces">Mes annonces</Link></Button>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Communications</h2>
          <p className="text-sm text-muted-foreground mb-4">Vos messages et réservations en un coup d'œil.</p>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="default" size="sm"><Link to="/messages">Messages</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/mes-reservations">Réservations</Link></Button>
          </div>
        </Card>
        <Card className="p-6">
          <h2 className="font-semibold mb-3 flex items-center gap-2"><BarChart3 className="h-4 w-4" /> Performance</h2>
          <p className="text-sm text-muted-foreground mb-4">Statistiques de vente, revenus, conversion et avis reçus.</p>
          <div className="flex gap-2 flex-wrap">
            <Button asChild variant="default" size="sm"><Link to="/statistiques-vendeur"><BarChart3 className="h-4 w-4" /> Statistiques</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/mes-avis"><Star className="h-4 w-4" /> Mes avis</Link></Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
