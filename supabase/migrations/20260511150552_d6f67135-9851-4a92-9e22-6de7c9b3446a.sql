-- ============================================================
-- PHASE 1 BOARDEAL — FONDATIONS DB (rôles étendus + moteur affiliation)
-- ============================================================

-- ===== ENUMS =====
CREATE TYPE public.user_type AS ENUM (
  'buyer','merchant','closer','influencer','promoter','professional','employer'
);
CREATE TYPE public.qr_target_type AS ENUM ('shop','product','service','campaign');
CREATE TYPE public.commission_status AS ENUM ('pending','approved','paid','cancelled');
CREATE TYPE public.payout_status AS ENUM ('pending','processing','paid','failed');
CREATE TYPE public.payout_method AS ENUM ('bank_transfer','paypal','stripe_connect','manual');
CREATE TYPE public.subscription_status AS ENUM ('active','trialing','past_due','canceled','unpaid');
CREATE TYPE public.job_ticket_status AS ENUM ('open','in_progress','resolved','closed');
CREATE TYPE public.points_source AS ENUM ('qr_visit','qr_conversion','bonus','adjustment','redemption');
CREATE TYPE public.affiliate_kind AS ENUM ('closer','influencer','promoter');
CREATE TYPE public.kyc_status AS ENUM ('pending','approved','rejected');

-- Helper: updated_at trigger réutilise public.update_updated_at_column existante.

-- ============================================================
-- PROFILS ÉTENDUS PAR RÔLE
-- ============================================================
CREATE TABLE public.merchant_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  business_name TEXT NOT NULL,
  neq_number TEXT,
  description TEXT,
  logo_url TEXT,
  website_url TEXT,
  city TEXT,
  region TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.merchant_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view merchant profiles" ON public.merchant_profiles FOR SELECT USING (true);
CREATE POLICY "Owner manage merchant profile" ON public.merchant_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage merchant profiles" ON public.merchant_profiles
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_merchant_profiles_updated BEFORE UPDATE ON public.merchant_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.affiliate_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  kind public.affiliate_kind NOT NULL,
  display_name TEXT,
  bio TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  kyc_status public.kyc_status NOT NULL DEFAULT 'pending',
  kyc_documents TEXT[] NOT NULL DEFAULT '{}',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.affiliate_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view affiliate profile" ON public.affiliate_profiles
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owner upsert affiliate profile" ON public.affiliate_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Owner update affiliate profile" ON public.affiliate_profiles
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admin manage affiliate profiles" ON public.affiliate_profiles
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_affiliate_profiles_updated BEFORE UPDATE ON public.affiliate_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.professional_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  headline TEXT NOT NULL,
  bio TEXT,
  skills TEXT[] NOT NULL DEFAULT '{}',
  sector TEXT,
  city TEXT,
  available_from DATE,
  hourly_rate NUMERIC,
  portfolio_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.professional_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view public pros" ON public.professional_profiles
  FOR SELECT USING (is_public = true OR auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owner manage pro profile" ON public.professional_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage pro profiles" ON public.professional_profiles
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_professional_profiles_updated BEFORE UPDATE ON public.professional_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.employer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  sector TEXT,
  size TEXT,
  city TEXT,
  website_url TEXT,
  description TEXT,
  is_verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employer_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view employer profiles" ON public.employer_profiles FOR SELECT USING (true);
CREATE POLICY "Owner manage employer profile" ON public.employer_profiles
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin manage employer profiles" ON public.employer_profiles
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_employer_profiles_updated BEFORE UPDATE ON public.employer_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- AFFILIATIONS
-- ============================================================
CREATE TABLE public.shop_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_user_id UUID NOT NULL,
  merchant_user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending|active|suspended|revoked
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(affiliate_user_id, merchant_user_id)
);
ALTER TABLE public.shop_affiliations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view affiliation" ON public.shop_affiliations
  FOR SELECT USING (auth.uid() = affiliate_user_id OR auth.uid() = merchant_user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Affiliate request affiliation" ON public.shop_affiliations
  FOR INSERT WITH CHECK (auth.uid() = affiliate_user_id);
CREATE POLICY "Merchant update affiliation" ON public.shop_affiliations
  FOR UPDATE USING (auth.uid() = merchant_user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage affiliations" ON public.shop_affiliations
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_shop_affiliations_updated BEFORE UPDATE ON public.shop_affiliations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- MOTEUR QR
-- ============================================================
CREATE TABLE public.qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  owner_user_id UUID NOT NULL,
  owner_role public.user_type NOT NULL,
  target_type public.qr_target_type NOT NULL,
  target_id UUID,
  target_url TEXT,
  discount_pct NUMERIC,
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qr_codes_owner ON public.qr_codes(owner_user_id);
CREATE INDEX idx_qr_codes_target ON public.qr_codes(target_type, target_id);
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active qr" ON public.qr_codes
  FOR SELECT USING (is_active = true OR auth.uid() = owner_user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Owner create qr" ON public.qr_codes
  FOR INSERT WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Owner update qr" ON public.qr_codes
  FOR UPDATE USING (auth.uid() = owner_user_id);
CREATE POLICY "Admin manage qr" ON public.qr_codes
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_qr_codes_updated BEFORE UPDATE ON public.qr_codes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.qr_visits (
  id BIGSERIAL PRIMARY KEY,
  qr_id UUID NOT NULL,
  visitor_fingerprint TEXT,
  ip_country TEXT,
  user_agent TEXT,
  referrer TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qr_visits_qr ON public.qr_visits(qr_id, created_at DESC);
ALTER TABLE public.qr_visits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view qr visits" ON public.qr_visits
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.qr_codes q WHERE q.id = qr_visits.qr_id AND q.owner_user_id = auth.uid())
    OR has_role(auth.uid(),'admin')
  );
CREATE POLICY "Admin manage qr visits" ON public.qr_visits
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.qr_conversions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_id UUID NOT NULL,
  ticket_id UUID,
  order_ref TEXT,
  gross_amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  commission_total NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_qr_conversions_qr ON public.qr_conversions(qr_id, created_at DESC);
ALTER TABLE public.qr_conversions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view qr conversions" ON public.qr_conversions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.qr_codes q WHERE q.id = qr_conversions.qr_id AND q.owner_user_id = auth.uid())
    OR has_role(auth.uid(),'admin')
  );
CREATE POLICY "Admin manage qr conversions" ON public.qr_conversions
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qr_conversion_id UUID NOT NULL,
  beneficiary_user_id UUID NOT NULL,
  role public.user_type NOT NULL,
  pct NUMERIC NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  status public.commission_status NOT NULL DEFAULT 'pending',
  payout_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_commissions_beneficiary ON public.commissions(beneficiary_user_id, status);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Beneficiary view commissions" ON public.commissions
  FOR SELECT USING (auth.uid() = beneficiary_user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage commissions" ON public.commissions
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_commissions_updated BEFORE UPDATE ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- POINTS & PAYOUTS
-- ============================================================
CREATE TABLE public.points_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  delta INTEGER NOT NULL,
  source public.points_source NOT NULL,
  ref_id TEXT,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_points_ledger_user ON public.points_ledger(user_id, created_at DESC);
ALTER TABLE public.points_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view points" ON public.points_ledger
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage points" ON public.points_ledger
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

CREATE TABLE public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'CAD',
  method public.payout_method NOT NULL DEFAULT 'manual',
  status public.payout_status NOT NULL DEFAULT 'pending',
  period_start DATE,
  period_end DATE,
  external_ref TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view payouts" ON public.payouts
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage payouts" ON public.payouts
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_payouts_updated BEFORE UPDATE ON public.payouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- ABONNEMENTS
-- ============================================================
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'CAD',
  interval TEXT NOT NULL DEFAULT 'month',
  target_role public.user_type,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active plans" ON public.subscription_plans
  FOR SELECT USING (is_active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage plans" ON public.subscription_plans
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_subscription_plans_updated BEFORE UPDATE ON public.subscription_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan_code TEXT NOT NULL,
  status public.subscription_status NOT NULL DEFAULT 'active',
  current_period_end TIMESTAMPTZ,
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_user_subs_user ON public.user_subscriptions(user_id);
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner view subscription" ON public.user_subscriptions
  FOR SELECT USING (auth.uid() = user_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage subscriptions" ON public.user_subscriptions
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_user_subs_updated BEFORE UPDATE ON public.user_subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- TICKETS EMPLOI
-- ============================================================
CREATE TABLE public.job_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_id UUID NOT NULL,
  professional_id UUID NOT NULL,
  subject TEXT NOT NULL,
  status public.job_ticket_status NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.job_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view job ticket" ON public.job_tickets
  FOR SELECT USING (auth.uid() = employer_id OR auth.uid() = professional_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Employer create job ticket" ON public.job_tickets
  FOR INSERT WITH CHECK (auth.uid() = employer_id);
CREATE POLICY "Parties update job ticket" ON public.job_tickets
  FOR UPDATE USING (auth.uid() = employer_id OR auth.uid() = professional_id OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage job tickets" ON public.job_tickets
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_job_tickets_updated BEFORE UPDATE ON public.job_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.job_ticket_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  filtered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_job_ticket_messages_ticket ON public.job_ticket_messages(ticket_id, created_at);
ALTER TABLE public.job_ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Parties view ticket messages" ON public.job_ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.job_tickets t
      WHERE t.id = job_ticket_messages.ticket_id
        AND (auth.uid() = t.employer_id OR auth.uid() = t.professional_id)
    ) OR has_role(auth.uid(),'admin')
  );
CREATE POLICY "Parties send ticket messages" ON public.job_ticket_messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND EXISTS (
      SELECT 1 FROM public.job_tickets t
      WHERE t.id = job_ticket_messages.ticket_id
        AND (auth.uid() = t.employer_id OR auth.uid() = t.professional_id)
    )
  );
CREATE POLICY "Admin manage ticket messages" ON public.job_ticket_messages
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));

-- ============================================================
-- RÈGLES DE COMMISSIONS (paramétrables)
-- ============================================================
CREATE TABLE public.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_kind public.affiliate_kind NOT NULL,
  pct_platform NUMERIC NOT NULL DEFAULT 50,
  pct_affiliate NUMERIC NOT NULL DEFAULT 50,
  points_per_visit INTEGER NOT NULL DEFAULT 1,
  points_to_money_threshold INTEGER NOT NULL DEFAULT 1000,
  points_to_money_rate NUMERIC NOT NULL DEFAULT 1.00,
  is_active BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(affiliate_kind, is_active) DEFERRABLE INITIALLY DEFERRED
);
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active commission rules" ON public.commission_rules
  FOR SELECT USING (is_active = true OR has_role(auth.uid(),'admin'));
CREATE POLICY "Admin manage commission rules" ON public.commission_rules
  FOR ALL USING (has_role(auth.uid(),'admin')) WITH CHECK (has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_commission_rules_updated BEFORE UPDATE ON public.commission_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seeds par défaut (50/50)
INSERT INTO public.commission_rules (affiliate_kind, pct_platform, pct_affiliate, points_per_visit, points_to_money_threshold, points_to_money_rate, notes)
VALUES
  ('closer',     50, 50, 1, 1000, 1.00, 'Règle par défaut closer'),
  ('influencer', 50, 50, 2, 1000, 1.00, 'Règle par défaut influencer'),
  ('promoter',   50, 50, 1, 1000, 1.00, 'Règle par défaut promoter');