-- Add featured + discount fields to listings
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured_until timestamp with time zone,
  ADD COLUMN IF NOT EXISTS featured_priority integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS original_price numeric,
  ADD COLUMN IF NOT EXISTS discount_percent numeric;

-- Index for fast featured queries
CREATE INDEX IF NOT EXISTS idx_listings_featured
  ON public.listings (is_featured, featured_until DESC, featured_priority DESC)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_listings_discount
  ON public.listings (discount_percent DESC)
  WHERE status = 'active' AND discount_percent IS NOT NULL;

-- Geo index for "near me" queries
CREATE INDEX IF NOT EXISTS idx_listings_geo
  ON public.listings (latitude, longitude)
  WHERE status = 'active';

-- Auto-compute discount_percent when original_price is set
CREATE OR REPLACE FUNCTION public.compute_listing_discount()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.original_price IS NOT NULL AND NEW.original_price > NEW.price AND NEW.original_price > 0 THEN
    NEW.discount_percent := ROUND(((NEW.original_price - NEW.price) / NEW.original_price * 100)::numeric, 2);
  ELSE
    NEW.discount_percent := NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_compute_listing_discount ON public.listings;
CREATE TRIGGER trg_compute_listing_discount
  BEFORE INSERT OR UPDATE OF price, original_price ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.compute_listing_discount();

-- Restrict is_featured / featured_until / featured_priority to admins only
CREATE OR REPLACE FUNCTION public.guard_featured_fields()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.is_featured IS DISTINCT FROM OLD.is_featured)
     OR (NEW.featured_until IS DISTINCT FROM OLD.featured_until)
     OR (NEW.featured_priority IS DISTINCT FROM OLD.featured_priority)
  THEN
    IF NOT public.has_role(auth.uid(), 'admin') THEN
      RAISE EXCEPTION 'Only admins can modify featured fields';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_featured_fields ON public.listings;
CREATE TRIGGER trg_guard_featured_fields
  BEFORE UPDATE ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_featured_fields();

-- Block non-admin from setting featured fields on INSERT
CREATE OR REPLACE FUNCTION public.guard_featured_fields_insert()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (NEW.is_featured = true OR NEW.featured_until IS NOT NULL OR NEW.featured_priority <> 0)
     AND NOT public.has_role(auth.uid(), 'admin')
  THEN
    NEW.is_featured := false;
    NEW.featured_until := NULL;
    NEW.featured_priority := 0;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_featured_fields_insert ON public.listings;
CREATE TRIGGER trg_guard_featured_fields_insert
  BEFORE INSERT ON public.listings
  FOR EACH ROW EXECUTE FUNCTION public.guard_featured_fields_insert();