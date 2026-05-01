import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/customClient";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { StarRating } from "./StarRating";
import { useListingReviews, useListingRatingStats } from "@/hooks/useReviews";

type Props = { listingId: string; sellerId: string };

export function ReviewList({ listingId, sellerId }: Props) {
  const { user } = useAuth();
  const { data: reviews = [], isLoading } = useListingReviews(listingId);
  const { data: stats } = useListingRatingStats(listingId);
  const qc = useQueryClient();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [responseText, setResponseText] = useState("");

  const respond = useMutation({
    mutationFn: async ({ id, text }: { id: string; text: string }) => {
      const { error } = await supabase.from("reviews").update({ seller_response: text }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Réponse publiée");
      qc.invalidateQueries({ queryKey: ["reviews"] });
      setRespondingId(null);
      setResponseText("");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement des avis…</p>;

  return (
    <div className="space-y-4">
      {stats && stats.total > 0 && (
        <div className="flex items-center gap-3">
          <StarRating value={stats.avg} size="md" />
          <span className="text-lg font-semibold">{stats.avg.toFixed(1)}</span>
          <span className="text-sm text-muted-foreground">({stats.total} avis)</span>
        </div>
      )}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">Aucun avis pour le moment.</p>
      ) : (
        reviews.map((r) => (
          <Card key={r.id} className="p-4">
            <div className="flex items-start justify-between gap-4 mb-2">
              <div>
                <StarRating value={r.rating} size="sm" />
                {r.title && <h4 className="font-semibold mt-1">{r.title}</h4>}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleDateString("fr-CA")}
              </span>
            </div>
            {r.comment && <p className="text-sm text-foreground/90 whitespace-pre-line">{r.comment}</p>}
            {r.seller_response && (
              <div className="mt-3 pl-3 border-l-2 border-primary/40 bg-secondary/20 p-2 rounded">
                <p className="text-xs font-semibold mb-1">Réponse du vendeur</p>
                <p className="text-sm whitespace-pre-line">{r.seller_response}</p>
              </div>
            )}
            {user?.id === sellerId && !r.seller_response && (
              <div className="mt-3">
                {respondingId === r.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={responseText}
                      onChange={(e) => setResponseText(e.target.value)}
                      rows={2}
                      maxLength={1000}
                      placeholder="Votre réponse…"
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => respond.mutate({ id: r.id, text: responseText })}
                        disabled={!responseText.trim() || respond.isPending}
                      >
                        Publier
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setRespondingId(null)}>
                        Annuler
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => setRespondingId(r.id)}>
                    Répondre
                  </Button>
                )}
              </div>
            )}
          </Card>
        ))
      )}
    </div>
  );
}
