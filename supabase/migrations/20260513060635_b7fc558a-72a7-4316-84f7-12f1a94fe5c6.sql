
-- 1) ENUM deal_type
DO $$ BEGIN
  CREATE TYPE public.deal_type AS ENUM (
    'damaged_packaging',
    'overstock',
    'end_of_season',
    'clearance',
    'promo_40plus',
    'trending'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Colonnes sur listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS deal_type public.deal_type,
  ADD COLUMN IF NOT EXISTS boost_weight integer NOT NULL DEFAULT 0;

-- 3) Trigger pour empêcher non-admin de modifier boost_weight
CREATE OR REPLACE FUNCTION public.guard_boost_weight()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.boost_weight IS DISTINCT FROM 0 AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      NEW.boost_weight := 0;
    END IF;
  ELSIF TG_OP = 'UPDATE' THEN
    IF NEW.boost_weight IS DISTINCT FROM OLD.boost_weight
       AND NOT public.has_role(auth.uid(), 'admin'::app_role) THEN
      RAISE EXCEPTION 'Only admins can modify boost_weight';
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_boost_weight_ins ON public.listings;
CREATE TRIGGER trg_guard_boost_weight_ins
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_boost_weight();

DROP TRIGGER IF EXISTS trg_guard_boost_weight_upd ON public.listings;
CREATE TRIGGER trg_guard_boost_weight_upd
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_boost_weight();

-- 4) Indexes (full-text français + géo + deal_type)
CREATE INDEX IF NOT EXISTS idx_listings_fts
  ON public.listings
  USING gin (to_tsvector('french', coalesce(title,'') || ' ' || coalesce(description,'') || ' ' || coalesce(city,'')));

CREATE INDEX IF NOT EXISTS idx_listings_geo
  ON public.listings (latitude, longitude)
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_listings_deal_type ON public.listings (deal_type) WHERE deal_type IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_listings_status_created ON public.listings (status, created_at DESC);

-- 5) Vue ranked_listings : score composite
CREATE OR REPLACE VIEW public.ranked_listings AS
SELECT
  l.*,
  EXISTS (
    SELECT 1 FROM public.flash_sales fs
    WHERE fs.listing_id = l.id
      AND fs.is_active = true
      AND fs.starts_at <= now()
      AND fs.ends_at >= now()
  ) AS has_active_flash,
  -- Score : boost (x100) + featured priority (x50) + flash actif (x30) + fraîcheur décroissante
  (
    COALESCE(l.boost_weight, 0) * 100
    + COALESCE(l.featured_priority, 0) * 50
    + CASE WHEN l.is_featured AND (l.featured_until IS NULL OR l.featured_until > now()) THEN 40 ELSE 0 END
    + CASE WHEN EXISTS (
        SELECT 1 FROM public.flash_sales fs
        WHERE fs.listing_id = l.id AND fs.is_active = true
          AND fs.starts_at <= now() AND fs.ends_at >= now()
      ) THEN 30 ELSE 0 END
    + GREATEST(0, 30 - EXTRACT(EPOCH FROM (now() - l.created_at)) / 86400)::integer
  ) AS rank_score
FROM public.listings l
WHERE l.status = 'active';

GRANT SELECT ON public.ranked_listings TO anon, authenticated;

-- 6) Fonction de recherche unifiée (texte + filtre deal_type + catégorie + distance Haversine)
CREATE OR REPLACE FUNCTION public.search_ranked_listings(
  _q text DEFAULT NULL,
  _deal_type public.deal_type DEFAULT NULL,
  _category_id uuid DEFAULT NULL,
  _lat numeric DEFAULT NULL,
  _lng numeric DEFAULT NULL,
  _radius_km numeric DEFAULT NULL,
  _limit int DEFAULT 24,
  _offset int DEFAULT 0
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  price numeric,
  original_price numeric,
  discount_percent numeric,
  currency text,
  images text[],
  city text,
  region text,
  category_id uuid,
  subcategory_id uuid,
  deal_type public.deal_type,
  is_featured boolean,
  featured_priority integer,
  has_active_flash boolean,
  latitude numeric,
  longitude numeric,
  created_at timestamptz,
  rank_score integer,
  distance_km numeric
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH base AS (
    SELECT r.*,
      CASE
        WHEN _lat IS NOT NULL AND _lng IS NOT NULL
             AND r.latitude IS NOT NULL AND r.longitude IS NOT NULL
        THEN (
          6371 * acos(
            LEAST(1.0, GREATEST(-1.0,
              cos(radians(_lat)) * cos(radians(r.latitude))
              * cos(radians(r.longitude) - radians(_lng))
              + sin(radians(_lat)) * sin(radians(r.latitude))
            ))
          )
        )::numeric
        ELSE NULL
      END AS dist_km,
      CASE
        WHEN _q IS NOT NULL AND length(trim(_q)) > 0
        THEN ts_rank(
          to_tsvector('french', coalesce(r.title,'') || ' ' || coalesce(r.description,'') || ' ' || coalesce(r.city,'')),
          plainto_tsquery('french', _q)
        )
        ELSE 0
      END AS text_rank
    FROM public.ranked_listings r
    WHERE
      (_deal_type IS NULL OR r.deal_type = _deal_type)
      AND (_category_id IS NULL OR r.category_id = _category_id OR r.subcategory_id = _category_id)
      AND (
        _q IS NULL OR length(trim(_q)) = 0
        OR to_tsvector('french', coalesce(r.title,'') || ' ' || coalesce(r.description,'') || ' ' || coalesce(r.city,''))
           @@ plainto_tsquery('french', _q)
      )
  )
  SELECT
    b.id, b.title, b.description, b.price, b.original_price, b.discount_percent,
    b.currency, b.images, b.city, b.region, b.category_id, b.subcategory_id,
    b.deal_type, b.is_featured, b.featured_priority, b.has_active_flash,
    b.latitude, b.longitude, b.created_at, b.rank_score,
    b.dist_km AS distance_km
  FROM base b
  WHERE _radius_km IS NULL OR b.dist_km IS NULL OR b.dist_km <= _radius_km
  ORDER BY
    b.rank_score DESC,
    b.text_rank DESC NULLS LAST,
    b.dist_km ASC NULLS LAST,
    b.created_at DESC
  LIMIT GREATEST(1, LEAST(_limit, 100))
  OFFSET GREATEST(0, _offset);
$$;

GRANT EXECUTE ON FUNCTION public.search_ranked_listings(text, public.deal_type, uuid, numeric, numeric, numeric, int, int) TO anon, authenticated;
