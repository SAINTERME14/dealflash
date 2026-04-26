import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { StarRating } from "./StarRating";

type Props = {
  ticketId: string;
  listingId: string;
  sellerId: string;
  onDone?: () => void;
};

export function ReviewForm({ ticketId, listingId, sellerId, onDone }: Props) {
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const qc = useQueryClient();

  const submit = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Connexion requise");
      const { error } = await supabase.from("reviews").insert({
        ticket_id: ticketId,
        listing_id: listingId,
        buyer_id: user.id,
        seller_id: sellerId,
        rating,
        title: title.trim() || null,
        comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Merci ! Votre avis a été publié.");
      qc.invalidateQueries({ queryKey: ["reviews"] });
      onDone?.();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit.mutate();
      }}
      className="space-y-4"
    >
      <div>
        <Label className="mb-2 block">Votre note</Label>
        <StarRating value={rating} interactive onChange={setRating} size="lg" />
      </div>
      <div>
        <Label htmlFor="review-title">Titre (optionnel)</Label>
        <Input id="review-title" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120} placeholder="Excellent vendeur !" />
      </div>
      <div>
        <Label htmlFor="review-comment">Commentaire</Label>
        <Textarea id="review-comment" value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={4} placeholder="Décrivez votre expérience…" />
      </div>
      <Button type="submit" disabled={submit.isPending}>
        {submit.isPending ? "Envoi…" : "Publier mon avis"}
      </Button>
    </form>
  );
}
