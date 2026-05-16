
-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.market_status AS ENUM ('active','inactive');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.lead_status AS ENUM ('scanned','converted','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- MARKETS ----------
CREATE TABLE IF NOT EXISTS public.markets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  country_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  languages TEXT[] NOT NULL DEFAULT ARRAY['fr','en'],
  status public.market_status NOT NULL DEFAULT 'active',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_markets_one_default
  ON public.markets ((is_default)) WHERE is_default = true;

ALTER TABLE public.markets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "markets_public_read"
  ON public.markets FOR SELECT
  USING (status = 'active' OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "markets_admin_all"
  ON public.markets FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_markets_updated
  BEFORE UPDATE ON public.markets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.markets (country_code, name, currency, languages, status, is_default)
SELECT 'CA','Canada','CAD',ARRAY['fr','en'],'active',true
WHERE NOT EXISTS (SELECT 1 FROM public.markets);

-- ---------- FEATURE FLAGS ----------
CREATE TABLE IF NOT EXISTS public.feature_flags (
  key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT false,
  description TEXT,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flags_public_read"
  ON public.feature_flags FOR SELECT USING (true);

CREATE POLICY "flags_admin_write"
  ON public.feature_flags FOR ALL
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_feature_flags_updated
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.feature_flags (key, enabled, description) VALUES
  ('tickets_enabled', true,  'Active la logique de tickets (réservations payantes).'),
  ('leads_enabled',   true,  'Active la logique de leads via QR de rabais.')
ON CONFLICT (key) DO NOTHING;

-- ---------- LEADS ----------
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
  qr_visit_id BIGINT REFERENCES public.qr_visits(id) ON DELETE SET NULL,
  merchant_user_id UUID NOT NULL,
  affiliate_user_id UUID,
  customer_user_id UUID,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  channel TEXT,                 -- closer | influencer | promoter | advertiser
  status public.lead_status NOT NULL DEFAULT 'scanned',
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  converted_at TIMESTAMPTZ,
  amount_cents INTEGER,
  currency TEXT DEFAULT 'CAD',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_leads_merchant  ON public.leads(merchant_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_affiliate ON public.leads(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_customer  ON public.leads(customer_user_id);
CREATE INDEX IF NOT EXISTS idx_leads_status    ON public.leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_qr        ON public.leads(qr_id);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads_select_related"
  ON public.leads FOR SELECT
  USING (
    auth.uid() = merchant_user_id
    OR auth.uid() = affiliate_user_id
    OR auth.uid() = customer_user_id
    OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "leads_insert_merchant_or_admin"
  ON public.leads FOR INSERT
  WITH CHECK (
    auth.uid() = merchant_user_id
    OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "leads_update_merchant_or_admin"
  ON public.leads FOR UPDATE
  USING (
    auth.uid() = merchant_user_id
    OR public.has_role(auth.uid(),'admin')
  );

CREATE POLICY "leads_delete_admin"
  ON public.leads FOR DELETE
  USING (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_leads_updated
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
