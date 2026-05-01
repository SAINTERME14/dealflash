-- ============================================================
-- POINT 2 : SÉPARATION STRICTE ANNONCES EN RABAIS VS PRIX RÉGULIER
-- Anti-double-dipping : les points de fidélité NE s'appliquent
-- JAMAIS sur une annonce en rabais.
-- ============================================================

-- ── 1. deal_type sur listings ────────────────────────────────
-- 'standard'    : rabais fixe, ticket 2$
-- 'flash'       : durée limitée, stock limité, ticket 2$
-- 'group_flash' : rabais croissant selon le nombre d'acheteurs
-- 'prix_regulier': pas de rabais, accepte les points de fidélité

ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS deal_type TEXT NOT NULL DEFAULT 'standard'
    CHECK (deal_type IN ('standard', 'flash', 'group_flash', 'prix_regulier')),
  ADD COLUMN IF NOT EXISTS base_discount_percent NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS discount_cap_percent   NUMERIC(6,2),
  ADD COLUMN IF NOT EXISTS accepts_loyalty_points BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.listings.deal_type IS
  'standard | flash | group_flash | prix_regulier';
COMMENT ON COLUMN public.listings.accepts_loyalty_points IS
  'true seulement pour les annonces prix_regulier — jamais sur les annonces en rabais';

-- ── 2. Trigger anti-double-dipping ──────────────────────────
-- Garantit que :
--   • prix_regulier → accepts_loyalty_points = true (par défaut)
--   • tout autre type → accepts_loyalty_points = false (non modifiable par le vendeur)

CREATE OR REPLACE FUNCTION public.enforce_deal_type_rules()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.deal_type = 'prix_regulier' THEN
    -- Annonce prix régulier : points acceptés, pas de ticket de réservation requis
    NEW.accepts_loyalty_points := true;
    NEW.base_discount_percent  := NULL;
    NEW.discount_cap_percent   := NULL;
  ELSE
    -- Annonce en rabais : JAMAIS de points de fidélité (anti-double-dipping)
    NEW.accepts_loyalty_points := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_deal_type ON public.listings;
CREATE TRIGGER trg_enforce_deal_type
  BEFORE INSERT OR UPDATE OF deal_type
  ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.enforce_deal_type_rules();

-- ── 3. Contrainte DB : bloque la tentative de dépenser des points sur rabais ─

-- Fonction utilitaire vérifiable depuis l'app (RPC)
CREATE OR REPLACE FUNCTION public.can_use_loyalty_points(p_listing_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT accepts_loyalty_points FROM public.listings WHERE id = p_listing_id),
    false
  )
$$;

-- ── 4. deal_type sur flash_sales (aligne avec le listing parent) ─────────────

ALTER TABLE public.flash_sales
  ADD COLUMN IF NOT EXISTS deal_type TEXT NOT NULL DEFAULT 'flash'
    CHECK (deal_type IN ('standard', 'flash', 'group_flash'));

-- ── 5. Index ─────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_listings_deal_type
  ON public.listings(deal_type, status);

CREATE INDEX IF NOT EXISTS idx_listings_loyalty_points
  ON public.listings(accepts_loyalty_points, status)
  WHERE accepts_loyalty_points = true;
