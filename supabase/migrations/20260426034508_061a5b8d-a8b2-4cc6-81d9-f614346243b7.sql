
-- Table des avis
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  comment TEXT,
  seller_response TEXT,
  seller_response_at TIMESTAMPTZ,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  hidden_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(ticket_id)
);

CREATE INDEX idx_reviews_listing ON public.reviews(listing_id) WHERE is_hidden = false;
CREATE INDEX idx_reviews_seller ON public.reviews(seller_id) WHERE is_hidden = false;
CREATE INDEX idx_reviews_buyer ON public.reviews(buyer_id);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique des avis non masqués
CREATE POLICY "Public can read visible reviews"
ON public.reviews FOR SELECT
USING (is_hidden = false OR auth.uid() = buyer_id OR auth.uid() = seller_id OR public.has_role(auth.uid(), 'admin'));

-- Création : acheteur avec ticket validé
CREATE POLICY "Buyers with validated ticket can create review"
ON public.reviews FOR INSERT
WITH CHECK (
  auth.uid() = buyer_id
  AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = reviews.ticket_id
      AND t.buyer_id = auth.uid()
      AND t.listing_id = reviews.listing_id
      AND t.seller_id = reviews.seller_id
      AND t.status = 'validated'
  )
);

-- Update : acheteur sur son avis (note/commentaire) ou vendeur (réponse uniquement)
CREATE POLICY "Buyer can update own review"
ON public.reviews FOR UPDATE
USING (auth.uid() = buyer_id)
WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Seller can respond to review"
ON public.reviews FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Admins can update any review"
ON public.reviews FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Delete : acheteur ou admin
CREATE POLICY "Buyer can delete own review"
ON public.reviews FOR DELETE
USING (auth.uid() = buyer_id);

CREATE POLICY "Admins can delete any review"
ON public.reviews FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  IF NEW.seller_response IS DISTINCT FROM OLD.seller_response AND NEW.seller_response IS NOT NULL THEN
    NEW.seller_response_at = now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_reviews_updated_at
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_reviews_updated_at();

-- Fonction RPC : statistiques d'un vendeur
CREATE OR REPLACE FUNCTION public.get_seller_rating_stats(_seller_id UUID)
RETURNS TABLE(avg_rating NUMERIC, total_reviews BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0) AS avg_rating,
    COUNT(*)::BIGINT AS total_reviews
  FROM public.reviews
  WHERE seller_id = _seller_id AND is_hidden = false;
$$;

-- Fonction RPC : statistiques d'une annonce
CREATE OR REPLACE FUNCTION public.get_listing_rating_stats(_listing_id UUID)
RETURNS TABLE(avg_rating NUMERIC, total_reviews BIGINT)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    COALESCE(ROUND(AVG(rating)::NUMERIC, 2), 0) AS avg_rating,
    COUNT(*)::BIGINT AS total_reviews
  FROM public.reviews
  WHERE listing_id = _listing_id AND is_hidden = false;
$$;

-- Notification au vendeur lors d'un nouvel avis
CREATE OR REPLACE FUNCTION public.notify_seller_on_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications(user_id, type, title, message, link)
  VALUES (
    NEW.seller_id,
    'admin_announcement',
    'Nouvel avis reçu',
    'Vous avez reçu un avis ' || NEW.rating || ' étoile(s).',
    '/annonce/' || NEW.listing_id::text
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_seller_on_review
AFTER INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.notify_seller_on_review();
