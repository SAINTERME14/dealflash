-- ============================================================
-- MODÈLE COMPLET DEALFLASH
-- Sections A → J  — aucune donnée existante supprimée/modifiée
-- Toutes les opérations sont idempotentes (IF NOT EXISTS, DO $$)
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- A — TABLE listings : nouvelles colonnes
-- ════════════════════════════════════════════════════════════

-- ── A.1 Vidéo ────────────────────────────────────────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS video_url              TEXT,
  ADD COLUMN IF NOT EXISTS video_platform         VARCHAR(20)
    CHECK (video_platform IN ('tiktok','facebook','instagram','youtube')),
  ADD COLUMN IF NOT EXISTS video_embed_html       TEXT,
  ADD COLUMN IF NOT EXISTS video_thumbnail_url    TEXT,
  ADD COLUMN IF NOT EXISTS video_status           VARCHAR(20)  DEFAULT 'active'
    CHECK (video_status IN ('active','broken','removed')),
  ADD COLUMN IF NOT EXISTS video_last_checked_at  TIMESTAMPTZ;

-- ── A.2 Durée et statut ──────────────────────────────────────
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS listing_starts_at  TIMESTAMPTZ  DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS listing_ends_at    TIMESTAMPTZ,
  -- listing_status est distinct de l'enum 'status' existant
  ADD COLUMN IF NOT EXISTS listing_status     VARCHAR(20)  DEFAULT 'active'
    CHECK (listing_status IN ('active','paused','expired','sold'));

-- ── A.3 Prix en centimes (coexiste avec price NUMERIC existant) ──
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS price_cents        INT;   -- nullable : rempli par trigger ci-dessous

-- ── A.4 Rabais gradué (nouveaux noms, sans toucher aux colonnes
--        base_discount_percent / social_sharing_bonus_per_platform existantes) ──
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS base_discount_pct          NUMERIC(5,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS max_total_discount_pct     NUMERIC(5,2) DEFAULT 20.00,
  ADD COLUMN IF NOT EXISTS social_bonus_per_platform_pct NUMERIC(5,2) DEFAULT 2.00,
  ADD COLUMN IF NOT EXISTS social_bonus_max_pct       NUMERIC(5,2) DEFAULT 5.00,
  ADD COLUMN IF NOT EXISTS ticket_price_cents         INT          DEFAULT 200;

-- ── A.5 Colonne générée has_active_discount (ajoutée une seule fois) ────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'listings'
      AND column_name  = 'has_active_discount'
  ) THEN
    ALTER TABLE public.listings
      ADD COLUMN has_active_discount BOOLEAN GENERATED ALWAYS AS (
        base_discount_pct > 0
        AND deal_type NOT IN ('regular', 'prix_regulier')
      ) STORED;
  END IF;
END $$;

-- ── A.6 Étendre le CHECK deal_type pour inclure la valeur 'regular' ──
-- Supprime l'ancienne contrainte (schéma uniquement, pas de données)
-- puis recrée avec les deux alias 'regular' et 'prix_regulier'.
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS listings_deal_type_check;

ALTER TABLE public.listings
  ADD CONSTRAINT listings_deal_type_check
    CHECK (deal_type IN ('standard','flash','group_flash','prix_regulier','regular'));

-- ── A.7 Acceptation des points (colonne existante — pas de doublon) ─
-- accepts_loyalty_points déjà présent, on ajoute seulement le CHECK
-- anti-double-dipping via la colonne générée has_active_discount.
ALTER TABLE public.listings
  DROP CONSTRAINT IF EXISTS no_double_dipping;

ALTER TABLE public.listings
  ADD CONSTRAINT no_double_dipping
    CHECK (NOT (has_active_discount AND accepts_loyalty_points));

-- ── A.8 Modalités retrait / livraison (nouveaux champs, coexistent
--        avec pickup_info / delivery_info / payment_methods existants) ──
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS pickup_methods           JSONB    DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS pickup_address           TEXT,
  ADD COLUMN IF NOT EXISTS delivery_zones           TEXT[],
  ADD COLUMN IF NOT EXISTS delivery_fees            JSONB,
  ADD COLUMN IF NOT EXISTS accepted_payment_methods JSONB    DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS response_time_hours      INT;

-- ── A.9 Trigger : synchronise price_cents depuis price ──────
CREATE OR REPLACE FUNCTION public.sync_price_cents()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.price IS NOT NULL AND NEW.price_cents IS NULL THEN
    NEW.price_cents := ROUND(NEW.price * 100)::INT;
  END IF;
  IF NEW.price_cents IS NOT NULL AND NEW.price IS NULL THEN
    NEW.price := NEW.price_cents / 100.0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_price_cents ON public.listings;
CREATE TRIGGER trg_sync_price_cents
  BEFORE INSERT OR UPDATE OF price, price_cents
  ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.sync_price_cents();

-- Backfill price_cents pour les lignes existantes
UPDATE public.listings
SET price_cents = ROUND(price * 100)::INT
WHERE price_cents IS NULL AND price IS NOT NULL;

-- Index nouveaux champs
CREATE INDEX IF NOT EXISTS idx_listings_listing_ends_at
  ON public.listings(listing_ends_at) WHERE listing_ends_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_listing_status
  ON public.listings(listing_status, listing_starts_at);
CREATE INDEX IF NOT EXISTS idx_listings_has_discount
  ON public.listings(has_active_discount, listing_status)
  WHERE has_active_discount = true;


-- ════════════════════════════════════════════════════════════
-- B — TABLE listing_group_tiers
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.listing_group_tiers (
  id          UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id  UUID      NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  threshold   INT       NOT NULL CHECK (threshold > 0),
  bonus_pct   NUMERIC(5,2) NOT NULL CHECK (bonus_pct >= 0),
  position    INT       NOT NULL,
  UNIQUE (listing_id, threshold)
);

CREATE INDEX IF NOT EXISTS idx_tiers_listing
  ON public.listing_group_tiers(listing_id, threshold);

ALTER TABLE public.listing_group_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tiers viewable by everyone"
  ON public.listing_group_tiers FOR SELECT USING (true);

CREATE POLICY "Sellers manage their listing tiers"
  ON public.listing_group_tiers FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_id AND l.seller_id = auth.uid()
  ));


-- ════════════════════════════════════════════════════════════
-- C — TABLE listing_photos
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.listing_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id      UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  position        INT  NOT NULL CHECK (position BETWEEN 1 AND 8),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (listing_id, position)
);

CREATE INDEX IF NOT EXISTS idx_listing_photos_listing
  ON public.listing_photos(listing_id, position);

ALTER TABLE public.listing_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Photos viewable by everyone"
  ON public.listing_photos FOR SELECT USING (true);

CREATE POLICY "Sellers manage their listing photos"
  ON public.listing_photos FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.listings l
    WHERE l.id = listing_id AND l.seller_id = auth.uid()
  ));


-- ════════════════════════════════════════════════════════════
-- D — TABLE reservations (tickets payés — remplace la logique ticket)
--     Coexiste avec la table tickets existante
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.reservations (
  id                   UUID     PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id           UUID     NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id             UUID     NOT NULL REFERENCES auth.users(id),
  seller_id            UUID     NOT NULL REFERENCES auth.users(id),
  qr_code_token        TEXT     UNIQUE NOT NULL
                                DEFAULT upper(replace(gen_random_uuid()::TEXT, '-', '')),
  payment_intent_id    TEXT     NOT NULL,
  ticket_amount_cents  INT      NOT NULL,
  base_discount_pct    NUMERIC(5,2) NOT NULL DEFAULT 0,
  social_bonus_pct     NUMERIC(5,2) NOT NULL DEFAULT 0,
  group_bonus_pct      NUMERIC(5,2) NOT NULL DEFAULT 0,
  -- final_discount_pct calculé automatiquement
  final_discount_pct   NUMERIC(5,2) GENERATED ALWAYS AS (
    LEAST(base_discount_pct + social_bonus_pct + group_bonus_pct, 100)
  ) STORED,
  status               VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active','order_placed','completed','expired','cancelled','disputed')),
  expires_at           TIMESTAMPTZ NOT NULL,
  ordered_at           TIMESTAMPTZ,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reservations_buyer
  ON public.reservations(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_listing
  ON public.reservations(listing_id, status);
CREATE INDEX IF NOT EXISTS idx_reservations_expires
  ON public.reservations(expires_at) WHERE status = 'active';

-- Un seul ticket actif par (listing, acheteur)
CREATE UNIQUE INDEX IF NOT EXISTS idx_one_active_reservation
  ON public.reservations(listing_id, buyer_id)
  WHERE status = 'active';

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see their reservations"
  ON public.reservations FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers see reservations on their listings"
  ON public.reservations FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers create their reservations"
  ON public.reservations FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers cancel their reservations"
  ON public.reservations FOR UPDATE USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers update reservations on their listings"
  ON public.reservations FOR UPDATE USING (auth.uid() = seller_id);
CREATE POLICY "Admins manage all reservations"
  ON public.reservations FOR ALL USING (public.has_role(auth.uid(), 'admin'));


-- ════════════════════════════════════════════════════════════
-- E — TABLE discount_bonuses_earned
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.discount_bonuses_earned (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id  UUID NOT NULL REFERENCES public.reservations(id) ON DELETE CASCADE,
  bonus_type      VARCHAR(20) NOT NULL
    CHECK (bonus_type IN ('social_share', 'group_tier')),
  bonus_pct       NUMERIC(5,2) NOT NULL,
  platform        VARCHAR(20),
  tier_threshold  INT,
  share_url       TEXT,
  user_agent      TEXT,
  ip_hash         TEXT,
  earned_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- Un seul enregistrement par (réservation, type, plateforme)
  UNIQUE (reservation_id, bonus_type, platform),
  UNIQUE (reservation_id, bonus_type, tier_threshold)
);

CREATE INDEX IF NOT EXISTS idx_bonuses_reservation
  ON public.discount_bonuses_earned(reservation_id);

ALTER TABLE public.discount_bonuses_earned ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see their bonuses"
  ON public.discount_bonuses_earned FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.reservations r
    WHERE r.id = reservation_id AND r.buyer_id = auth.uid()
  ));
CREATE POLICY "Service role inserts bonuses"
  ON public.discount_bonuses_earned FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));


-- ════════════════════════════════════════════════════════════
-- F — POINTS DE FIDÉLITÉ (modèle complet)
--     Coexiste avec loyalty_points et listing_shares existants
-- ════════════════════════════════════════════════════════════

-- ── F.1 user_loyalty_balance ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.user_loyalty_balance (
  user_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seller_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance   INT  NOT NULL DEFAULT 0 CHECK (current_balance >= 0),
  lifetime_earned   INT  NOT NULL DEFAULT 0,
  lifetime_spent    INT  NOT NULL DEFAULT 0,
  last_activity_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, seller_id)
);

CREATE INDEX IF NOT EXISTS idx_loyalty_user
  ON public.user_loyalty_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_seller
  ON public.user_loyalty_balance(seller_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_inactivity
  ON public.user_loyalty_balance(last_activity_at)
  WHERE current_balance > 0;

ALTER TABLE public.user_loyalty_balance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own loyalty balance"
  ON public.user_loyalty_balance FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vendors see balances earned toward them"
  ON public.user_loyalty_balance FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Admins manage loyalty balances"
  ON public.user_loyalty_balance FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── F.2 loyalty_transactions : ajouter les colonnes manquantes ──
--    (la table existe déjà avec type loyalty_tx_type, points_delta, etc.)
ALTER TABLE public.loyalty_transactions
  ADD COLUMN IF NOT EXISTS transaction_type  VARCHAR(20)
    CHECK (transaction_type IN ('earned_share','spent_purchase','expired','admin_adjustment')),
  ADD COLUMN IF NOT EXISTS amount            INT,
  ADD COLUMN IF NOT EXISTS related_order_id  UUID, -- FK ajoutée après création de orders
  ADD COLUMN IF NOT EXISTS share_url         TEXT,
  ADD COLUMN IF NOT EXISTS user_agent        TEXT,
  ADD COLUMN IF NOT EXISTS ip_hash           TEXT;

-- Index manquant sur seller_id (pour les requêtes vendeur)
CREATE INDEX IF NOT EXISTS idx_loyalty_tx_seller
  ON public.loyalty_transactions(vendor_id, created_at DESC);

-- ── F.3 loyalty_share_log ─────────────────────────────────────
--    Distinct de listing_shares existant : enregistre aussi user_agent/ip_hash
CREATE TABLE IF NOT EXISTS public.loyalty_share_log (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id  UUID NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  platform    VARCHAR(20) NOT NULL
    CHECK (platform IN ('tiktok','facebook','instagram','whatsapp')),
  shared_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent  TEXT,
  ip_hash     TEXT,
  UNIQUE (user_id, listing_id, platform)
);

CREATE INDEX IF NOT EXISTS idx_share_log_user
  ON public.loyalty_share_log(user_id, shared_at DESC);
CREATE INDEX IF NOT EXISTS idx_share_log_listing
  ON public.loyalty_share_log(listing_id);

ALTER TABLE public.loyalty_share_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own share log"
  ON public.loyalty_share_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users insert their own shares"
  ON public.loyalty_share_log FOR INSERT WITH CHECK (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════
-- G — TABLE orders (bons de commande — cœur posture facilitateur)
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.orders (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reservation_id        UUID REFERENCES public.reservations(id),
  listing_id            UUID NOT NULL REFERENCES public.listings(id),
  buyer_id              UUID NOT NULL REFERENCES auth.users(id),
  seller_id             UUID NOT NULL REFERENCES auth.users(id),

  -- ── Prix (DealFlash NE TOUCHE PAS cet argent) ────────────
  initial_price_cents   INT          NOT NULL,
  discount_pct_applied  NUMERIC(5,2) NOT NULL DEFAULT 0,
  loyalty_points_used   INT          NOT NULL DEFAULT 0,
  loyalty_discount_pct  NUMERIC(5,2) NOT NULL DEFAULT 0,
  final_price_cents     INT          NOT NULL,

  -- ── Modalités convenues ───────────────────────────────────
  pickup_method         VARCHAR(50)  NOT NULL,
  delivery_address      TEXT,
  delivery_fee_cents    INT          NOT NULL DEFAULT 0,
  payment_method        VARCHAR(50),

  -- ── Validation cryptographique ───────────────────────────
  order_token           TEXT         UNIQUE NOT NULL
                                     DEFAULT upper(replace(gen_random_uuid()::TEXT, '-', '')),
  order_signature       TEXT         NOT NULL, -- HMAC-SHA256 signé par confirm-order
  qr_code_data          TEXT         NOT NULL,
  pdf_storage_path      TEXT,

  -- ── Suivi ────────────────────────────────────────────────
  status                VARCHAR(20)  NOT NULL DEFAULT 'pending'
    CHECK (status IN (
      'pending','acknowledged_by_seller','paid','shipped','completed',
      'cancelled','disputed'
    )),
  notes                 TEXT,
  created_at            TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  acknowledged_at       TIMESTAMPTZ,
  paid_at               TIMESTAMPTZ,
  shipped_at            TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_orders_buyer
  ON public.orders(buyer_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_seller
  ON public.orders(seller_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_reservation
  ON public.orders(reservation_id) WHERE reservation_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_orders_token
  ON public.orders(order_token);
CREATE INDEX IF NOT EXISTS idx_orders_created
  ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers see their orders"
  ON public.orders FOR SELECT USING (auth.uid() = buyer_id);
CREATE POLICY "Sellers see their orders"
  ON public.orders FOR SELECT USING (auth.uid() = seller_id);
CREATE POLICY "Buyers create their orders"
  ON public.orders FOR INSERT WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "Buyers and sellers update orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
CREATE POLICY "Admins manage all orders"
  ON public.orders FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- ── Maintenant qu'orders existe, ajouter la FK depuis loyalty_transactions ──
ALTER TABLE public.loyalty_transactions
  DROP CONSTRAINT IF EXISTS fk_loyalty_order;

ALTER TABLE public.loyalty_transactions
  ADD CONSTRAINT fk_loyalty_order
    FOREIGN KEY (related_order_id) REFERENCES public.orders(id)
    ON DELETE SET NULL;


-- ════════════════════════════════════════════════════════════
-- H — TABLE order_status_history
-- ════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.order_status_history (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  from_status       VARCHAR(20),
  to_status         VARCHAR(20) NOT NULL,
  changed_by_user_id UUID REFERENCES auth.users(id),
  changed_by_role   VARCHAR(20)
    CHECK (changed_by_role IN ('buyer','seller','system','admin')),
  notes             TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_history_order
  ON public.order_status_history(order_id, created_at DESC);

ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers and sellers see their order history"
  ON public.order_status_history FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  ));
CREATE POLICY "System and admins insert history"
  ON public.order_status_history FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger : insère automatiquement une ligne d'historique à chaque changement de statut
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.order_status_history
      (order_id, from_status, to_status, changed_by_user_id, changed_by_role)
    VALUES
      (NEW.id, OLD.status, NEW.status, auth.uid(), 'system');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_status_history ON public.orders;
CREATE TRIGGER trg_order_status_history
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();


-- ════════════════════════════════════════════════════════════
-- I — LITIGES ET RÉPUTATION
-- ════════════════════════════════════════════════════════════

-- ── I.1 order_disputes ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_disputes (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id            UUID NOT NULL REFERENCES public.orders(id),
  raised_by_user_id   UUID NOT NULL REFERENCES auth.users(id),
  raised_by_role      VARCHAR(20)
    CHECK (raised_by_role IN ('buyer','seller','admin')),
  category            VARCHAR(50) NOT NULL,
  description         TEXT        NOT NULL,
  status              VARCHAR(20) NOT NULL DEFAULT 'open'
    CHECK (status IN ('open','investigating','resolved','closed')),
  resolution          TEXT,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_disputes_order
  ON public.order_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status
  ON public.order_disputes(status, created_at DESC);

ALTER TABLE public.order_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Buyers and sellers see their disputes"
  ON public.order_disputes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.orders o
    WHERE o.id = order_id
      AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
  ));
CREATE POLICY "Admins manage disputes"
  ON public.order_disputes FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Buyers and sellers open disputes"
  ON public.order_disputes FOR INSERT
  WITH CHECK (auth.uid() = raised_by_user_id);

-- ── I.2 order_ratings ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.order_ratings (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id          UUID NOT NULL REFERENCES public.orders(id),
  rated_by_user_id  UUID NOT NULL REFERENCES auth.users(id),
  rated_user_id     UUID NOT NULL REFERENCES auth.users(id),
  rating            INT  NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment           TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (order_id, rated_by_user_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_order
  ON public.order_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_ratings_rated_user
  ON public.order_ratings(rated_user_id, created_at DESC);

ALTER TABLE public.order_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read ratings"
  ON public.order_ratings FOR SELECT USING (true);
CREATE POLICY "Users rate only their own orders"
  ON public.order_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = rated_by_user_id
    AND EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id
        AND o.status = 'completed'
        AND (o.buyer_id = auth.uid() OR o.seller_id = auth.uid())
    )
  );

-- ── I.3 seller_reputation ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.seller_reputation (
  seller_id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  total_orders       INT          NOT NULL DEFAULT 0,
  completed_orders   INT          NOT NULL DEFAULT 0,
  cancelled_orders   INT          NOT NULL DEFAULT 0,
  disputed_orders    INT          NOT NULL DEFAULT 0,
  average_rating     NUMERIC(3,2),
  -- honor_rate_pct calculé automatiquement
  honor_rate_pct     NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN total_orders > 0
    THEN ROUND((completed_orders::NUMERIC / total_orders) * 100, 2)
    ELSE NULL END
  ) STORED,
  last_updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

ALTER TABLE public.seller_reputation ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Seller reputation is public"
  ON public.seller_reputation FOR SELECT USING (true);
CREATE POLICY "System updates seller reputation"
  ON public.seller_reputation FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Trigger : met à jour seller_reputation à chaque changement de statut de commande
CREATE OR REPLACE FUNCTION public.update_seller_reputation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.seller_reputation (seller_id)
    VALUES (NEW.seller_id)
    ON CONFLICT (seller_id) DO NOTHING;

    UPDATE public.seller_reputation SET
      total_orders     = (SELECT COUNT(*) FROM public.orders
                          WHERE seller_id = NEW.seller_id
                            AND status NOT IN ('pending','cancelled')),
      completed_orders = (SELECT COUNT(*) FROM public.orders
                          WHERE seller_id = NEW.seller_id AND status = 'completed'),
      cancelled_orders = (SELECT COUNT(*) FROM public.orders
                          WHERE seller_id = NEW.seller_id AND status = 'cancelled'),
      disputed_orders  = (SELECT COUNT(*) FROM public.orders
                          WHERE seller_id = NEW.seller_id AND status = 'disputed'),
      average_rating   = (SELECT AVG(r.rating) FROM public.order_ratings r
                          JOIN public.orders o ON o.id = r.order_id
                          WHERE o.seller_id = NEW.seller_id),
      last_updated_at  = NOW()
    WHERE seller_id = NEW.seller_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_seller_reputation ON public.orders;
CREATE TRIGGER trg_update_seller_reputation
  AFTER UPDATE OF status ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_seller_reputation();


-- ════════════════════════════════════════════════════════════
-- J — TRIGGER d'activité loyalty (loyalty_share_log → user_loyalty_balance)
-- ════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.update_loyalty_activity()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  -- Rafraîchit last_activity_at sur user_loyalty_balance pour chaque vendeur lié
  UPDATE public.user_loyalty_balance ulb
  SET last_activity_at = NOW()
  FROM public.listings l
  WHERE l.id = NEW.listing_id
    AND ulb.user_id   = NEW.user_id
    AND ulb.seller_id = l.seller_id;

  -- Si aucune ligne dans user_loyalty_balance, on ne crée pas :
  -- l'upsert se fait au moment du gain de points (RPC register_listing_share).
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_loyalty_activity ON public.loyalty_share_log;
CREATE TRIGGER trg_update_loyalty_activity
  AFTER INSERT ON public.loyalty_share_log
  FOR EACH ROW EXECUTE FUNCTION public.update_loyalty_activity();


-- ════════════════════════════════════════════════════════════
-- INDEX DE PERFORMANCE SUPPLÉMENTAIRES
-- ════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_reservations_qr
  ON public.reservations(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_orders_qr
  ON public.orders(qr_code_data);
CREATE INDEX IF NOT EXISTS idx_disputes_raised_by
  ON public.order_disputes(raised_by_user_id, status);
CREATE INDEX IF NOT EXISTS idx_seller_reputation_rating
  ON public.seller_reputation(average_rating DESC NULLS LAST);
