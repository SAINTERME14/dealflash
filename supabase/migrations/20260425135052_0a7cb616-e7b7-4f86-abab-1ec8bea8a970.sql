-- =========================================
-- 1. CATEGORIES : hiérarchie + frais ticket
-- =========================================

ALTER TABLE public.categories
  ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS ticket_fee_type TEXT NOT NULL DEFAULT 'fixed' CHECK (ticket_fee_type IN ('fixed','percent')),
  ADD COLUMN IF NOT EXISTS ticket_fee_value NUMERIC(10,2) NOT NULL DEFAULT 2.99,
  ADD COLUMN IF NOT EXISTS ticket_fee_max NUMERIC(10,2);

CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON public.categories(parent_id);

-- =========================================
-- 2. LISTINGS : sous-catégorie + RDV
-- =========================================

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS allows_appointment BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_listings_subcategory_id ON public.listings(subcategory_id);

-- =========================================
-- 3. FLASH SALES
-- =========================================

CREATE TABLE IF NOT EXISTS public.flash_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL,
  regular_price NUMERIC(10,2) NOT NULL,
  flash_price NUMERIC(10,2) NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  ticket_validity_hours INTEGER NOT NULL DEFAULT 48,
  stock_limit INTEGER,
  stock_sold INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_flash_sales_listing ON public.flash_sales(listing_id);
CREATE INDEX IF NOT EXISTS idx_flash_sales_active ON public.flash_sales(is_active, ends_at);

ALTER TABLE public.flash_sales ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Flash sales are viewable by everyone"
  ON public.flash_sales FOR SELECT USING (true);

CREATE POLICY "Sellers create their flash sales"
  ON public.flash_sales FOR INSERT WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers update their flash sales"
  ON public.flash_sales FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Sellers delete their flash sales"
  ON public.flash_sales FOR DELETE USING (auth.uid() = seller_id);

CREATE TRIGGER update_flash_sales_updated_at
  BEFORE UPDATE ON public.flash_sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 4. TICKETS de réservation
-- =========================================

CREATE TYPE public.ticket_status AS ENUM ('pending','paid','validated','expired','refunded','cancelled');

CREATE TABLE IF NOT EXISTS public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  flash_sale_id UUID REFERENCES public.flash_sales(id) ON DELETE SET NULL,
  appointment_id UUID,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  buyer_first_name TEXT NOT NULL,
  buyer_last_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  flash_price NUMERIC(10,2) NOT NULL,
  platform_fee NUMERIC(10,2) NOT NULL,
  total_paid NUMERIC(10,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  qr_code TEXT NOT NULL DEFAULT upper(replace(gen_random_uuid()::text,'-','')),
  confirmation_code TEXT NOT NULL DEFAULT upper(substring(gen_random_uuid()::text,1,8)),
  expires_at TIMESTAMPTZ NOT NULL,
  validated_at TIMESTAMPTZ,
  status public.ticket_status NOT NULL DEFAULT 'pending',
  stripe_session_id TEXT,
  stripe_payment_intent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tickets_buyer ON public.tickets(buyer_id);
CREATE INDEX IF NOT EXISTS idx_tickets_seller ON public.tickets(seller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_listing ON public.tickets(listing_id);
CREATE INDEX IF NOT EXISTS idx_tickets_qr ON public.tickets(qr_code);

ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see their tickets"
  ON public.tickets FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers see tickets on their listings"
  ON public.tickets FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Buyers create their tickets"
  ON public.tickets FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Sellers update tickets on their listings"
  ON public.tickets FOR UPDATE USING (auth.uid() = seller_id);

CREATE POLICY "Buyers can cancel their tickets"
  ON public.tickets FOR UPDATE USING (auth.uid() = buyer_id);

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 5. APPOINTMENTS (RDV logements/véhicules/services)
-- =========================================

CREATE TYPE public.appointment_status AS ENUM ('requested','accepted','rejected','paid','completed','cancelled');

CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  seller_id UUID NOT NULL,
  buyer_first_name TEXT NOT NULL,
  buyer_last_name TEXT NOT NULL,
  buyer_email TEXT NOT NULL,
  buyer_phone TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_start_time TIME NOT NULL,
  requested_end_time TIME NOT NULL,
  message TEXT,
  status public.appointment_status NOT NULL DEFAULT 'requested',
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_appointments_buyer ON public.appointments(buyer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_seller ON public.appointments(seller_id);
CREATE INDEX IF NOT EXISTS idx_appointments_listing ON public.appointments(listing_id);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see their appointments"
  ON public.appointments FOR SELECT USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers see appointments on their listings"
  ON public.appointments FOR SELECT USING (auth.uid() = seller_id);

CREATE POLICY "Buyers create their appointments"
  ON public.appointments FOR INSERT WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Buyers update their appointments"
  ON public.appointments FOR UPDATE USING (auth.uid() = buyer_id);

CREATE POLICY "Sellers update appointments on their listings"
  ON public.appointments FOR UPDATE USING (auth.uid() = seller_id);

CREATE TRIGGER update_appointments_updated_at
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();