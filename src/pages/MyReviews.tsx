import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ReviewForm } from "@/components/reviews/ReviewForm";
import { useMyReviewableTickets } from "@/hooks/useReviews";
import { Seo } from "@/components/seo/Seo";
import { Star } from "lucide-react";

type Reviewable = {
  id: string;
  listing_id: string;
  seller_id: string;
  listings: { title: string; images: string[] } | null;
};

export default function MyReviews() {
  const { data: tickets = [], isLoading } = useMyReviewableTickets();
  const [active, setActive] = useState<Reviewable | null>(null);

  return (
    <div className="container py-8 max-w-3xl">
      <Seo title="Avis à laisser — Boardeal" description="Notez vos derniers achats et aidez la communauté Boardeal." />
      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
        Mes avis à laisser
      </h1>
      {isLoading ? (
        <p className="text-muted-foreground">Chargement…</p>
      ) : tickets.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          Aucun achat en attente d'avis. Revenez après avoir validé un ticket !
        </Card>
      ) : (
        <div className="grid gap-3">
          {(tickets as Reviewable[]).map((t) => (
            <Card key={t.id} className="p-4 flex items-center gap-3">
              {t.listings?.images?.[0] && (
                <img src={t.listings.images[0]} alt="" className="h-16 w-16 object-cover rounded" />
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold truncate">{t.listings?.title ?? "Annonce"}</p>
              </div>
              <Button onClick={() => setActive(t)}>Laisser un avis</Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Votre avis sur « {active?.listings?.title} »</DialogTitle>
          </DialogHeader>
          {active && (
            <ReviewForm
              ticketId={active.id}
              listingId={active.listing_id}
              sellerId={active.seller_id}
              onDone={() => setActive(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
