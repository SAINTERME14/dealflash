import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/customClient";
import type { Database } from "@/integrations/supabase/types";
import { useAuth } from "@/hooks/useAuth";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface Booking {
  id: string;
  slot_date: string;
  start_time: string;
  end_time: string;
  status: string;
  confirmation_code: string;
  buyer_first_name: string;
  buyer_last_name: string;
  buyer_phone: string;
  message: string | null;
  listings: { id: string; title: string; images: string[] } | null;
}

type BadgeVariant = "default" | "secondary" | "outline" | "destructive";
const statusBadge: Record<string, { label: string; variant: BadgeVariant }> = {
  pending: { label: "En attente", variant: "secondary" },
  confirmed: { label: "Confirmée", variant: "default" },
  cancelled: { label: "Annulée", variant: "outline" },
  completed: { label: "Terminée", variant: "secondary" },
  no_show: { label: "Absente", variant: "outline" },
};

export default function MyBookings() {
  const { user } = useAuth();
  const [asBuyer, setAsBuyer] = useState<Booking[]>([]);
  const [asSeller, setAsSeller] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"buyer" | "seller">("buyer");

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [b, s] = await Promise.all([
      supabase.from("bookings").select("*, listings(id, title, images)").eq("buyer_id", user.id).order("slot_date", { ascending: false }),
      supabase.from("bookings").select("*, listings(id, title, images)").eq("seller_id", user.id).order("slot_date", { ascending: false }),
    ]);
    setAsBuyer((b.data ?? []) as unknown as Booking[]);
    setAsSeller((s.data ?? []) as unknown as Booking[]);
    setLoading(false);
  };

  useEffect(() => { document.title = "Mes réservations — DealFlash"; load(); }, [user]);

  const updateStatus = async (id: string, status: BookingStatus) => {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Statut mis à jour"); load(); }
  };

  const list = tab === "buyer" ? asBuyer : asSeller;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Mes réservations</h1>

      <div className="flex gap-2 mb-6">
        <Button variant={tab === "buyer" ? "default" : "outline"} onClick={() => setTab("buyer")}>
          Mes demandes ({asBuyer.length})
        </Button>
        <Button variant={tab === "seller" ? "default" : "outline"} onClick={() => setTab("seller")}>
          Demandes reçues ({asSeller.length})
        </Button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : list.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Aucune réservation.</Card>
      ) : (
        <div className="space-y-3">
          {list.map((b) => (
            <Card key={b.id} className="p-4 flex flex-col sm:flex-row gap-4">
              {b.listings?.images?.[0] && (
                <Link to={`/annonce/${b.listings.id}`} className="shrink-0">
                  <img src={b.listings.images[0]} alt="" className="w-full sm:w-24 h-20 rounded-lg object-cover" />
                </Link>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 mb-1">
                  <Link to={`/annonce/${b.listings?.id}`} className="font-medium hover:text-primary line-clamp-1 flex-1">
                    {b.listings?.title ?? "Annonce supprimée"}
                  </Link>
                  <Badge variant={statusBadge[b.status]?.variant}>{statusBadge[b.status]?.label}</Badge>
                </div>
                <p className="text-sm">
                  📅 {new Date(b.slot_date).toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  {" · "}
                  ⏰ {b.start_time.slice(0, 5)} → {b.end_time.slice(0, 5)}
                </p>
                {tab === "seller" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    👤 {b.buyer_first_name} {b.buyer_last_name} · 📞 {b.buyer_phone}
                  </p>
                )}
                {b.message && <p className="text-xs text-muted-foreground mt-1 italic">« {b.message} »</p>}
                <p className="text-xs font-mono text-muted-foreground mt-1">Code : {b.confirmation_code}</p>
              </div>
              {b.status === "pending" && (
                <div className="flex gap-2 sm:flex-col sm:items-end">
                  {tab === "seller" && (
                    <Button onClick={() => updateStatus(b.id, "confirmed")} variant="hero" size="sm">Confirmer</Button>
                  )}
                  <Button onClick={() => updateStatus(b.id, "cancelled")} variant="outline" size="sm">Annuler</Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
