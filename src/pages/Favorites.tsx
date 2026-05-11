import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/customClient";
import { useAuth } from "@/hooks/useAuth";
import { ListingCard, ListingCardData } from "@/components/listing/ListingCard";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";

export default function Favorites() {
  const { user } = useAuth();
  const [items, setItems] = useState<ListingCardData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "Mes favoris — Boardeal";
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("favorites")
        .select("listings(id, title, price, currency, city, images, allows_booking)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setItems(
        (data ?? [])
          .map((d) => (d as { listings: ListingCardData | null }).listings)
          .filter((l): l is ListingCardData => !!l)
      );
      setLoading(false);
    })();
  }, [user]);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold mb-6">Mes favoris</h1>
      {loading ? (
        <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">Aucun favori. Cliquez sur ❤ sur les annonces qui vous intéressent.</Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {items.map((l) => <ListingCard key={l.id} listing={l} />)}
        </div>
      )}
    </div>
  );
}
