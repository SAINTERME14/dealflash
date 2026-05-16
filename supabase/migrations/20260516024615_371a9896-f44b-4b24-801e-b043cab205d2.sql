
-- ============================================================
-- Compléter les modèles de données métier Boardeal
-- ============================================================

-- 1) PUBLICATIONS (republication multi-canal d'un affilié)
CREATE TABLE IF NOT EXISTS public.publications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  qr_code_id UUID REFERENCES public.qr_codes(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  channel TEXT NOT NULL,
  content TEXT,
  media_url TEXT,
  external_ref TEXT,
  external_url TEXT,
  posted_at TIMESTAMPTZ DEFAULT now(),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.publications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Affiliate sees own publications" ON public.publications
  FOR SELECT USING (auth.uid() = affiliate_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Affiliate creates own publications" ON public.publications
  FOR INSERT WITH CHECK (auth.uid() = affiliate_user_id);
CREATE POLICY "Affiliate updates own publications" ON public.publications
  FOR UPDATE USING (auth.uid() = affiliate_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Affiliate deletes own publications" ON public.publications
  FOR DELETE USING (auth.uid() = affiliate_user_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_publications_updated_at BEFORE UPDATE ON public.publications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_publications_affiliate ON public.publications(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_publications_listing ON public.publications(listing_id);

-- 2) SALES (ventes confirmées issues d'un lead)
CREATE TABLE IF NOT EXISTS public.sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES public.leads(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  merchant_user_id UUID NOT NULL,
  affiliate_user_id UUID,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'CAD',
  commission_amount_cents INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','confirmed','returned','cancelled')),
  confirmed_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant sees own sales" ON public.sales
  FOR SELECT USING (auth.uid() = merchant_user_id OR auth.uid() = affiliate_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Merchant creates own sales" ON public.sales
  FOR INSERT WITH CHECK (auth.uid() = merchant_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Merchant updates own sales" ON public.sales
  FOR UPDATE USING (auth.uid() = merchant_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin deletes sales" ON public.sales
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_sales_updated_at BEFORE UPDATE ON public.sales
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_sales_merchant ON public.sales(merchant_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_affiliate ON public.sales(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_sales_lead ON public.sales(lead_id);

-- 3) CAMPAIGNS (plans de booster par commerçant)
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_user_id UUID NOT NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'basic',
  booster_weight INTEGER NOT NULL DEFAULT 0,
  market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active campaigns" ON public.campaigns
  FOR SELECT USING (is_active = true OR auth.uid() = merchant_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages campaigns insert" ON public.campaigns
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages campaigns update" ON public.campaigns
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manages campaigns delete" ON public.campaigns
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_campaigns_merchant ON public.campaigns(merchant_user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_listing ON public.campaigns(listing_id);

-- 4) REPORTS (rapports de leads périodiques)
CREATE TABLE IF NOT EXISTS public.lead_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_user_id UUID NOT NULL,
  period TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  leads_count INTEGER NOT NULL DEFAULT 0,
  conversions_count INTEGER NOT NULL DEFAULT 0,
  total_revenue_cents BIGINT NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  sent_at TIMESTAMPTZ
);
ALTER TABLE public.lead_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Merchant sees own reports" ON public.lead_reports
  FOR SELECT USING (auth.uid() = merchant_user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin inserts reports" ON public.lead_reports
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin updates reports" ON public.lead_reports
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE INDEX IF NOT EXISTS idx_reports_merchant ON public.lead_reports(merchant_user_id, period_start);

-- 5) AD_SLOTS (emplacements publicitaires)
CREATE TABLE IF NOT EXISTS public.ad_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  location TEXT,
  width INTEGER,
  height INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  market_id UUID REFERENCES public.markets(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.ad_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads active ad slots" ON public.ad_slots
  FOR SELECT USING (is_active = true OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin writes ad slots i" ON public.ad_slots
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin writes ad slots u" ON public.ad_slots
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin writes ad slots d" ON public.ad_slots
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_ad_slots_updated_at BEFORE UPDATE ON public.ad_slots
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6) TRANSLATIONS (i18n configurable)
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  locale TEXT NOT NULL,
  value TEXT NOT NULL,
  namespace TEXT NOT NULL DEFAULT 'common',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (namespace, key, locale)
);
ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public reads translations" ON public.translations
  FOR SELECT USING (true);
CREATE POLICY "Admin writes translations i" ON public.translations
  FOR INSERT WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin writes translations u" ON public.translations
  FOR UPDATE USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admin writes translations d" ON public.translations
  FOR DELETE USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_translations_updated_at BEFORE UPDATE ON public.translations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_translations_lookup ON public.translations(namespace, locale, key);
