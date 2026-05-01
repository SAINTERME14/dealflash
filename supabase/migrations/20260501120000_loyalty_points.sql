-- ============================================================
-- POINT 3 : POINTS DE FIDÉLITÉ LIÉS À UN VENDEUR SPÉCIFIQUE
-- ============================================================
-- Règles clés :
--   • Points liés à (user_id, vendor_id) — pas un solde global
--   • Gagnés : 2 pts par plateforme partagée sur annonce en rabais
--   • Utilisés : UNIQUEMENT sur annonces prix_regulier du MÊME vendeur
--   • Conversion : 100 pts = 1 % de rabais, plafond 10 %
--   • Expiration : 6 mois d'inactivité (toute action réinitialise)
-- ============================================================

-- ── 1. Table listing_shares (partages sociaux) ───────────────
-- Sert à la fois à gagner des points (visiteurs) et
-- aux bonus sociaux des réservataires.

CREATE TABLE IF NOT EXISTS public.listing_shares (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  platform    TEXT NOT NULL CHECK (platform IN ('tiktok', 'facebook', 'instagram', 'whatsapp')),
  points_awarded INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, listing_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_listing_shares_user    ON public.listing_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_listing_shares_listing ON public.listing_shares(listing_id);

ALTER TABLE public.listing_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own shares"
  ON public.listing_shares FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users register their own shares"
  ON public.listing_shares FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ── 2. Table loyalty_points (solde par couple user/vendeur) ──

CREATE TABLE IF NOT EXISTS public.loyalty_points (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points           INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_points_user   ON public.loyalty_points(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_vendor ON public.loyalty_points(vendor_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_points_activity
  ON public.loyalty_points(last_activity_at);

ALTER TABLE public.loyalty_points ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own loyalty points"
  ON public.loyalty_points FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors see points earned toward them"
  ON public.loyalty_points FOR SELECT USING (auth.uid() = vendor_id);

CREATE TRIGGER update_loyalty_points_updated_at
  BEFORE UPDATE ON public.loyalty_points
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. Table loyalty_transactions (journal d'audit) ──────────

CREATE TYPE public.loyalty_tx_type AS ENUM (
  'earned_sharing',   -- visiteur partage une annonce en rabais
  'spent_purchase',   -- utilisé sur un achat prix_regulier
  'expired',          -- expiration après 6 mois d'inactivité
  'admin_adjustment'  -- correction manuelle admin
);

CREATE TABLE IF NOT EXISTS public.loyalty_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vendor_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type          public.loyalty_tx_type NOT NULL,
  points_delta  INTEGER NOT NULL,
  balance_after INTEGER NOT NULL CHECK (balance_after >= 0),
  listing_id    UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  platform      TEXT,
  notes         TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_tx_user   ON public.loyalty_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_vendor ON public.loyalty_transactions(vendor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_type   ON public.loyalty_transactions(type, created_at DESC);

ALTER TABLE public.loyalty_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own transactions"
  ON public.loyalty_transactions FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors see transactions toward them"
  ON public.loyalty_transactions FOR SELECT USING (auth.uid() = vendor_id);

CREATE POLICY "Admins see all transactions"
  ON public.loyalty_transactions FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- Insert via service role uniquement (fonctions RPC)
CREATE POLICY "Service role inserts transactions"
  ON public.loyalty_transactions FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── 4. Fonction RPC : enregistrer un partage + points ────────
-- Appelée depuis le client quand l'utilisateur clique "Partager".
-- Conformité Loi 25 : aucun partage automatique — action explicite seule.

CREATE OR REPLACE FUNCTION public.register_listing_share(
  p_listing_id UUID,
  p_platform   TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_vendor_id  UUID;
  v_deal_type  TEXT;
  v_points_to_award INTEGER := 0;
  v_current_pts INTEGER := 0;
  v_new_pts    INTEGER := 0;
  v_already    BOOLEAN;
BEGIN
  -- Vérifier que l'utilisateur est connecté
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  -- Vérifier la plateforme
  IF p_platform NOT IN ('tiktok', 'facebook', 'instagram', 'whatsapp') THEN
    RETURN jsonb_build_object('error', 'Plateforme non reconnue');
  END IF;

  -- Charger le listing
  SELECT seller_id, deal_type INTO v_vendor_id, v_deal_type
  FROM public.listings
  WHERE id = p_listing_id AND status = 'active';

  IF v_vendor_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Annonce introuvable');
  END IF;

  -- Vérifier si déjà partagé sur cette plateforme
  SELECT EXISTS (
    SELECT 1 FROM public.listing_shares
    WHERE user_id = v_user_id AND listing_id = p_listing_id AND platform = p_platform
  ) INTO v_already;

  -- Les points sont attribués UNIQUEMENT sur les annonces en RABAIS (pas prix_regulier)
  -- et seulement si l'utilisateur n'a PAS de ticket payé sur cette annonce (visiteur)
  IF NOT v_already AND v_deal_type <> 'prix_regulier' THEN
    DECLARE
      v_has_ticket BOOLEAN;
    BEGIN
      SELECT EXISTS (
        SELECT 1 FROM public.tickets
        WHERE buyer_id = v_user_id AND listing_id = p_listing_id AND status IN ('paid','validated')
      ) INTO v_has_ticket;

      -- Visiteur sans ticket = 2 points
      IF NOT v_has_ticket THEN
        v_points_to_award := 2;
      END IF;
    END;
  END IF;

  -- Enregistrer le partage (idempotent grâce au UNIQUE)
  INSERT INTO public.listing_shares (user_id, listing_id, platform, points_awarded)
  VALUES (v_user_id, p_listing_id, p_platform, v_points_to_award)
  ON CONFLICT (user_id, listing_id, platform) DO NOTHING;

  -- Si des points à attribuer
  IF v_points_to_award > 0 THEN
    -- Upsert du solde
    INSERT INTO public.loyalty_points (user_id, vendor_id, points, last_activity_at)
    VALUES (v_user_id, v_vendor_id, v_points_to_award, now())
    ON CONFLICT (user_id, vendor_id) DO UPDATE
      SET points = loyalty_points.points + v_points_to_award,
          last_activity_at = now(),
          updated_at = now()
    RETURNING points INTO v_new_pts;

    -- Journal
    INSERT INTO public.loyalty_transactions
      (user_id, vendor_id, type, points_delta, balance_after, listing_id, platform)
    VALUES
      (v_user_id, v_vendor_id, 'earned_sharing', v_points_to_award, v_new_pts, p_listing_id, p_platform);
  ELSE
    -- Rafraîchir last_activity_at même si 0 points (toute action réinitialise l'expiration)
    UPDATE public.loyalty_points
    SET last_activity_at = now(), updated_at = now()
    WHERE user_id = v_user_id AND vendor_id = v_vendor_id;
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'already_shared', v_already,
    'points_awarded', v_points_to_award
  );
END;
$$;

-- ── 5. Fonction RPC : calculer le rabais points sur un achat ─
-- Retourne le % de rabais applicable (max 10%) sur une annonce prix_regulier.

CREATE OR REPLACE FUNCTION public.get_loyalty_discount(
  p_listing_id UUID,
  p_points_to_use INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id    UUID := auth.uid();
  v_vendor_id  UUID;
  v_deal_type  TEXT;
  v_accepts    BOOLEAN;
  v_balance    INTEGER := 0;
  v_points_capped INTEGER;
  v_discount_pct NUMERIC(6,2);
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Non authentifié');
  END IF;

  SELECT seller_id, deal_type, accepts_loyalty_points
  INTO v_vendor_id, v_deal_type, v_accepts
  FROM public.listings
  WHERE id = p_listing_id AND status = 'active';

  IF v_vendor_id IS NULL THEN
    RETURN jsonb_build_object('error', 'Annonce introuvable');
  END IF;

  -- Anti-double-dipping : JAMAIS de points sur une annonce en rabais
  IF NOT v_accepts OR v_deal_type <> 'prix_regulier' THEN
    RETURN jsonb_build_object(
      'eligible', false,
      'reason', 'Les points de fidélité ne s''appliquent pas sur les annonces en rabais'
    );
  END IF;

  SELECT COALESCE(points, 0) INTO v_balance
  FROM public.loyalty_points
  WHERE user_id = v_user_id AND vendor_id = v_vendor_id;

  -- Plafond : 100 pts = 1%, max 10% → max 1000 pts utilisables
  v_points_capped := LEAST(LEAST(p_points_to_use, v_balance), 1000);
  v_discount_pct  := ROUND(v_points_capped / 100.0, 2);

  RETURN jsonb_build_object(
    'eligible', true,
    'balance', v_balance,
    'points_requested', p_points_to_use,
    'points_usable', v_points_capped,
    'discount_percent', v_discount_pct,
    'vendor_id', v_vendor_id
  );
END;
$$;

-- ── 6. Expiration : cron job daily (pg_cron requis) ──────────
-- Points expirés après 6 mois d'inactivité (aucune action sur DealFlash)

CREATE OR REPLACE FUNCTION public.expire_loyalty_points()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER := 0;
  r RECORD;
BEGIN
  FOR r IN
    SELECT user_id, vendor_id, points
    FROM public.loyalty_points
    WHERE points > 0
      AND last_activity_at < now() - INTERVAL '6 months'
  LOOP
    UPDATE public.loyalty_points
    SET points = 0, updated_at = now()
    WHERE user_id = r.user_id AND vendor_id = r.vendor_id;

    INSERT INTO public.loyalty_transactions
      (user_id, vendor_id, type, points_delta, balance_after, notes)
    VALUES
      (r.user_id, r.vendor_id, 'expired', -r.points, 0,
       'Expiration automatique — 6 mois d''inactivité');

    v_count := v_count + 1;
  END LOOP;
  RETURN v_count;
END;
$$;

-- Planification quotidienne (requiert pg_cron activé sur le projet)
SELECT cron.schedule(
  'expire-loyalty-points',
  '0 3 * * *',
  $$ SELECT public.expire_loyalty_points() $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');
