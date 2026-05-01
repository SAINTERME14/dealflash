-- ============================================================
-- POINT 4 : TICKET = FENÊTRE COMPLÈTE + RABAIS FIGÉ À L'ACHAT
-- ============================================================
-- Invariants garantis :
--   1. expires_at du ticket = ends_at de la flash_sale (voir webhook)
--   2. final_price est figé à order_confirmed_at (immuable après)
--   3. group_bonus_percent est calculé rétroactivement au moment
--      de la confirmation (stock_sold au moment de confirm-order)
--   4. Un bon de commande déjà confirmé ne peut plus être modifié
--      (trigger ci-dessous)
-- ============================================================

-- ── 1. Trigger : final_price immuable une fois confirmé ──────
-- Empêche toute modification de final_price / hmac_signature
-- après que order_confirmed_at est positionné.

CREATE OR REPLACE FUNCTION public.protect_confirmed_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- Si le ticket était déjà confirmé et qu'on tente de modifier
  -- les champs financiers critiques, on bloque.
  IF OLD.order_confirmed_at IS NOT NULL THEN
    IF NEW.final_price IS DISTINCT FROM OLD.final_price
       OR NEW.final_discount_percent IS DISTINCT FROM OLD.final_discount_percent
       OR NEW.hmac_signature IS DISTINCT FROM OLD.hmac_signature
    THEN
      RAISE EXCEPTION
        'Le bon de commande est déjà confirmé : final_price et hmac_signature sont immuables (ticket %).',
        OLD.id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_confirmed_order ON public.tickets;
CREATE TRIGGER trg_protect_confirmed_order
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.protect_confirmed_order();

-- ── 2. Contrainte : expires_at >= now() à la création ────────
-- Un ticket ne peut pas être créé avec une date d'expiration passée.

ALTER TABLE public.tickets
  DROP CONSTRAINT IF EXISTS chk_ticket_expires_future;

ALTER TABLE public.tickets
  ADD CONSTRAINT chk_ticket_expires_future
    CHECK (expires_at > created_at);

-- ── 3. Vue utilitaire : tickets actifs avec contexte de l'annonce ─

CREATE OR REPLACE VIEW public.v_active_tickets AS
SELECT
  t.id,
  t.buyer_id,
  t.seller_id,
  t.listing_id,
  t.flash_sale_id,
  t.status,
  t.confirmation_code,
  t.flash_price,
  t.platform_fee,
  t.final_price,
  t.final_discount_percent,
  t.social_bonus_percent,
  t.group_bonus_percent,
  t.order_confirmed_at,
  t.expires_at,
  t.created_at,
  l.title          AS listing_title,
  l.deal_type      AS listing_deal_type,
  l.ends_at        AS listing_ends_at,
  fs.ends_at       AS flash_sale_ends_at,
  fs.stock_sold    AS current_stock_sold,
  fs.group_bonus_tiers,
  fs.social_sharing_bonus_per_platform,
  fs.social_bonus_cap_percent,
  fs.max_discount_cap_percent,
  -- Le ticket est "dans la fenêtre" si expires_at est dans le futur
  (t.expires_at > now()) AS is_within_window,
  -- Le rabais final est figé si order_confirmed_at est positionné
  (t.order_confirmed_at IS NOT NULL) AS discount_frozen
FROM public.tickets t
JOIN public.listings l ON l.id = t.listing_id
LEFT JOIN public.flash_sales fs ON fs.id = t.flash_sale_id
WHERE t.status IN ('paid', 'validated');

-- ── 4. Commentaires documentant les invariants ───────────────

COMMENT ON TRIGGER trg_protect_confirmed_order ON public.tickets IS
  'Garantit l''immuabilité du bon de commande une fois confirmé (Point 4)';

COMMENT ON COLUMN public.tickets.expires_at IS
  'Égal à flash_sales.ends_at — le ticket est valide pour TOUTE la durée de l''annonce (Point 4)';

COMMENT ON COLUMN public.tickets.order_confirmed_at IS
  'Moment où l''acheteur a cliqué "Confirmer ma commande" — le rabais est figé à cet instant (Point 4)';

COMMENT ON COLUMN public.tickets.final_price IS
  'Prix final figé à order_confirmed_at, immuable (trigger trg_protect_confirmed_order)';

COMMENT ON COLUMN public.tickets.group_bonus_percent IS
  'Bonus de groupe calculé rétroactivement au stock_sold du moment de la confirmation (Point 4)';
