-- ============================================================
-- POINT 1 + 4 : FACILITATEUR FLOW + TICKET = FENÊTRE COMPLÈTE
-- ============================================================
-- DealFlash est facilitateur : n'encaisse que le ticket (2$).
-- Le bon de commande signé HMAC-SHA256 est généré à la
-- confirmation de commande (pas à la réservation du ticket).
-- Le ticket expire à la fin de la flash_sale (pas +48h).
-- ============================================================

-- ── 1. Champs facilitateur sur la table tickets ─────────────

ALTER TABLE public.tickets
  ADD COLUMN IF NOT EXISTS hmac_signature        TEXT,
  ADD COLUMN IF NOT EXISTS order_confirmed_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS final_discount_percent NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS final_price           NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS social_bonus_percent  NUMERIC(6,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS group_bonus_percent   NUMERIC(6,2) NOT NULL DEFAULT 0;

COMMENT ON COLUMN public.tickets.hmac_signature IS
  'Signature HMAC-SHA256 du payload du bon de commande (anti-falsification QR)';
COMMENT ON COLUMN public.tickets.order_confirmed_at IS
  'Moment où l''acheteur a généré le bon de commande (rabais figé à cet instant)';
COMMENT ON COLUMN public.tickets.final_discount_percent IS
  'Rabais total figé à order_confirmed_at (base + social + groupe, avant plafond)';
COMMENT ON COLUMN public.tickets.final_price IS
  'Prix final payé au vendeur, figé à order_confirmed_at';

-- ── 2. Config bonus sur flash_sales ─────────────────────────

ALTER TABLE public.flash_sales
  ADD COLUMN IF NOT EXISTS base_discount_percent            NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS social_sharing_bonus_per_platform NUMERIC(4,2) NOT NULL DEFAULT 2.0,
  ADD COLUMN IF NOT EXISTS social_bonus_cap_percent         NUMERIC(4,2)  NOT NULL DEFAULT 5.0,
  ADD COLUMN IF NOT EXISTS group_bonus_tiers                JSONB         NOT NULL DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS max_discount_cap_percent         NUMERIC(6,2);

COMMENT ON COLUMN public.flash_sales.base_discount_percent IS
  'Rabais de base garanti dès l''achat du ticket';
COMMENT ON COLUMN public.flash_sales.social_sharing_bonus_per_platform IS
  'Bonus additionnel par plateforme partagée (TikTok/FB/IG/WhatsApp), défaut +2%';
COMMENT ON COLUMN public.flash_sales.social_bonus_cap_percent IS
  'Plafond du bonus social, défaut +5%';
COMMENT ON COLUMN public.flash_sales.group_bonus_tiers IS
  'Paliers de groupe [{"min_buyers":10,"bonus_percent":3}, ...] — rétroactifs';
COMMENT ON COLUMN public.flash_sales.max_discount_cap_percent IS
  'Plafond absolu du rabais cumulé (base+social+groupe)';

-- Recalcul automatique de base_discount_percent depuis regular_price/flash_price
CREATE OR REPLACE FUNCTION public.sync_flash_sale_base_discount()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.regular_price > 0 THEN
    NEW.base_discount_percent :=
      ROUND(((NEW.regular_price - NEW.flash_price) / NEW.regular_price) * 100, 2);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_flash_discount ON public.flash_sales;
CREATE TRIGGER trg_sync_flash_discount
  BEFORE INSERT OR UPDATE OF regular_price, flash_price
  ON public.flash_sales
  FOR EACH ROW EXECUTE FUNCTION public.sync_flash_sale_base_discount();

-- ── 3. Infos contact vendeur sur listings (pour bon de commande) ──

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS seller_phone      TEXT,
  ADD COLUMN IF NOT EXISTS seller_email      TEXT,
  ADD COLUMN IF NOT EXISTS payment_methods   TEXT[]  NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS pickup_info       TEXT,
  ADD COLUMN IF NOT EXISTS delivery_info     TEXT,
  ADD COLUMN IF NOT EXISTS ends_at           TIMESTAMPTZ;

COMMENT ON COLUMN public.listings.payment_methods IS
  'Moyens de paiement acceptés par le vendeur (interac, virement, terminal, comptant, etc.)';
COMMENT ON COLUMN public.listings.ends_at IS
  'Date de fin de l''annonce — le ticket expire à cette date';

-- ── 4. Politique: acheteur peut confirmer sa commande ─────────

CREATE POLICY "Buyers can confirm their tickets"
  ON public.tickets FOR UPDATE
  USING (auth.uid() = buyer_id)
  WITH CHECK (auth.uid() = buyer_id);

-- ── 5. Index utiles ───────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_tickets_confirmed
  ON public.tickets(order_confirmed_at)
  WHERE order_confirmed_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_ends_at
  ON public.listings(ends_at)
  WHERE ends_at IS NOT NULL;
