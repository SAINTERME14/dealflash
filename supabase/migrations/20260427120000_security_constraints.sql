-- ============================================================
-- Migration sécurité : contraintes + vue featured côté serveur
-- ============================================================

-- 1. Contraintes CHECK sur les listings (validation côté serveur)
ALTER TABLE public.listings
  ADD CONSTRAINT listing_price_positive CHECK (price >= 0),
  ADD CONSTRAINT listing_title_length CHECK (char_length(title) BETWEEN 3 AND 200),
  ADD CONSTRAINT listing_description_length CHECK (char_length(description) <= 5000),
  ADD CONSTRAINT listing_currency_valid CHECK (currency IN ('CAD', 'USD'));

-- 2. Vue pour que featured_until soit évalué côté DB (pas côté client)
CREATE OR REPLACE VIEW public.active_listings_view AS
SELECT
  l.*,
  CASE
    WHEN l.featured_until IS NOT NULL AND l.featured_until <= NOW() THEN false
    ELSE l.is_featured
  END AS is_featured_live
FROM public.listings l
WHERE l.status = 'active';

-- 3. Index pour optimiser les requêtes par statut + ville
CREATE INDEX IF NOT EXISTS idx_listings_status_city ON public.listings(status, city);
CREATE INDEX IF NOT EXISTS idx_listings_created_desc ON public.listings(created_at DESC) WHERE status = 'active';

-- 4. Contraintes sur les messages (pas de messages vides)
ALTER TABLE public.messages
  ADD CONSTRAINT message_content_not_empty CHECK (char_length(trim(content)) > 0),
  ADD CONSTRAINT message_content_max_length CHECK (char_length(content) <= 2000);

-- 5. Contrainte sur les profils
ALTER TABLE public.profiles
  ADD CONSTRAINT display_name_length CHECK (display_name IS NULL OR char_length(display_name) BETWEEN 2 AND 50);
