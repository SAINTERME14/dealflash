import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/customClient";

export type ReviewRow = {
  id: string;
  ticket_id: string;
  listing_id: string;
  buyer_id: string;
  seller_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  seller_response: string | null;
  seller_response_at: string | null;
  is_hidden: boolean;
  created_at: string;
  updated_at: string;
};

export function useListingReviews(listingId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "listing", listingId],
    enabled: !!listingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("listing_id", listingId!)
        .eq("is_hidden", false)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as ReviewRow[];
    },
  });
}

export function useListingRatingStats(listingId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "stats", "listing", listingId],
    enabled: !!listingId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("listing_id", listingId!)
        .eq("is_hidden", false);
      if (error) throw error;
      const ratings = (data ?? []).map((row) => Number(row.rating)).filter((rating) => Number.isFinite(rating));
      const total = ratings.length;
      const avg = total ? ratings.reduce((sum, rating) => sum + rating, 0) / total : 0;
      return { avg, total };
    },
  });
}

export function useSellerRatingStats(sellerId: string | undefined) {
  return useQuery({
    queryKey: ["reviews", "stats", "seller", sellerId],
    enabled: !!sellerId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("rating")
        .eq("seller_id", sellerId!)
        .eq("is_hidden", false);
      if (error) throw error;
      const ratings = (data ?? []).map((row) => Number(row.rating)).filter((rating) => Number.isFinite(rating));
      const total = ratings.length;
      const avg = total ? ratings.reduce((sum, rating) => sum + rating, 0) / total : 0;
      return { avg, total };
    },
  });
}

export function useMyReviewableTickets() {
  return useQuery({
    queryKey: ["reviews", "reviewable"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await supabase
        .from("tickets")
        .select("id, listing_id, seller_id, validated_at, listings(title, images)")
        .eq("buyer_id", user.id)
        .eq("status", "validated");
      if (error) throw error;
      const tickets = data ?? [];
      const ids = tickets.map((t) => t.id);
      if (ids.length === 0) return [];
      const { data: existing } = await supabase
        .from("reviews")
        .select("ticket_id")
        .in("ticket_id", ids);
      const reviewed = new Set((existing ?? []).map((r) => r.ticket_id));
      return tickets.filter((t) => !reviewed.has(t.id));
    },
  });
}
