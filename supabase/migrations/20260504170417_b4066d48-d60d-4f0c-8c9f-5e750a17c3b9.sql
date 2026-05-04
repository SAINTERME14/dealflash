
-- 1) Helper: utilisateur bloqué ?
CREATE OR REPLACE FUNCTION public.is_user_blocked(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE((SELECT is_blocked FROM public.profiles WHERE user_id = _user_id), false)
$$;

-- 2) Renforcer les politiques d'écriture pour exclure les bloqués
-- Listings
DROP POLICY IF EXISTS "Sellers can insert their own listings" ON public.listings;
CREATE POLICY "Sellers can insert their own listings" ON public.listings
FOR INSERT WITH CHECK (auth.uid() = seller_id AND NOT public.is_user_blocked(auth.uid()));

DROP POLICY IF EXISTS "Sellers can update their own listings" ON public.listings;
CREATE POLICY "Sellers can update their own listings" ON public.listings
FOR UPDATE USING (auth.uid() = seller_id AND NOT public.is_user_blocked(auth.uid()));

-- Messages
DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages" ON public.messages
FOR INSERT WITH CHECK (auth.uid() = sender_id AND NOT public.is_user_blocked(auth.uid()));

-- Flash sales
DROP POLICY IF EXISTS "Sellers create their flash sales" ON public.flash_sales;
CREATE POLICY "Sellers create their flash sales" ON public.flash_sales
FOR INSERT WITH CHECK (auth.uid() = seller_id AND NOT public.is_user_blocked(auth.uid()));

-- Bookings
DROP POLICY IF EXISTS "Buyers create their own bookings" ON public.bookings;
CREATE POLICY "Buyers create their own bookings" ON public.bookings
FOR INSERT WITH CHECK (auth.uid() = buyer_id AND NOT public.is_user_blocked(auth.uid()));

-- Appointments
DROP POLICY IF EXISTS "Buyers create their appointments" ON public.appointments;
CREATE POLICY "Buyers create their appointments" ON public.appointments
FOR INSERT WITH CHECK (auth.uid() = buyer_id AND NOT public.is_user_blocked(auth.uid()));

-- Favorites
DROP POLICY IF EXISTS "Users add their own favorites" ON public.favorites;
CREATE POLICY "Users add their own favorites" ON public.favorites
FOR INSERT WITH CHECK (auth.uid() = user_id AND NOT public.is_user_blocked(auth.uid()));

-- Reviews
DROP POLICY IF EXISTS "Buyers with validated ticket can create review" ON public.reviews;
CREATE POLICY "Buyers with validated ticket can create review" ON public.reviews
FOR INSERT WITH CHECK (
  auth.uid() = buyer_id
  AND NOT public.is_user_blocked(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.tickets t
    WHERE t.id = reviews.ticket_id
      AND t.buyer_id = auth.uid()
      AND t.listing_id = reviews.listing_id
      AND t.seller_id = reviews.seller_id
      AND t.status = 'validated'::ticket_status
  )
);

-- 3) Table de logs d'erreurs côté client (détection bugs)
CREATE TABLE IF NOT EXISTS public.client_error_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  url text,
  user_agent text,
  message text NOT NULL,
  stack text,
  source text,
  severity text NOT NULL DEFAULT 'error',
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamptz,
  resolved_by uuid,
  context jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.client_error_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can log errors"
ON public.client_error_logs FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins view error logs"
ON public.client_error_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update error logs"
ON public.client_error_logs FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete error logs"
ON public.client_error_logs FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_client_error_logs_created ON public.client_error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_client_error_logs_resolved ON public.client_error_logs(resolved);
