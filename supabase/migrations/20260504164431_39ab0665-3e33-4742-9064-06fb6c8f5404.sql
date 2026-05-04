
-- Admin override policies for full control across the platform

-- LISTINGS
CREATE POLICY "Admins manage all listings - update"
ON public.listings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage all listings - delete"
ON public.listings FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins view all listings"
ON public.listings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- FLASH SALES
CREATE POLICY "Admins manage all flash sales"
ON public.flash_sales FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- BOOKINGS
CREATE POLICY "Admins view all bookings"
ON public.bookings FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all bookings"
ON public.bookings FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete all bookings"
ON public.bookings FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- APPOINTMENTS
CREATE POLICY "Admins view all appointments"
ON public.appointments FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update all appointments"
ON public.appointments FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete all appointments"
ON public.appointments FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- MESSAGES (moderation)
CREATE POLICY "Admins view all messages"
ON public.messages FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete messages"
ON public.messages FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- FAVORITES (cleanup capability)
CREATE POLICY "Admins delete favorites"
ON public.favorites FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- Block / suspend users via profile flag
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS blocked_reason text,
  ADD COLUMN IF NOT EXISTS blocked_at timestamptz;

CREATE POLICY "Admins update any profile"
ON public.profiles FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));
