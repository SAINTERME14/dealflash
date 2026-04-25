-- Audit log table for featured/boost changes
CREATE TABLE IF NOT EXISTS public.featured_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL,
  actor_id uuid,
  action text NOT NULL,
  was_featured boolean,
  is_featured boolean,
  old_priority integer,
  new_priority integer,
  old_until timestamptz,
  new_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.featured_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view featured audit log"
ON public.featured_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Insert is performed by trigger (security definer) — no client-side insert needed
-- but we add a permissive insert policy guarded to admins for completeness.
CREATE POLICY "Admins can insert featured audit log"
ON public.featured_audit_log
FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Trigger function: writes a row whenever any featured field changes
CREATE OR REPLACE FUNCTION public.log_featured_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    IF NEW.is_featured IS DISTINCT FROM OLD.is_featured
       OR NEW.featured_until IS DISTINCT FROM OLD.featured_until
       OR NEW.featured_priority IS DISTINCT FROM OLD.featured_priority
    THEN
      IF OLD.is_featured = false AND NEW.is_featured = true THEN
        v_action := 'enabled';
      ELSIF OLD.is_featured = true AND NEW.is_featured = false THEN
        v_action := 'disabled';
      ELSIF NEW.featured_until IS DISTINCT FROM OLD.featured_until
            AND NEW.featured_until IS NOT NULL
            AND (OLD.featured_until IS NULL OR NEW.featured_until > OLD.featured_until) THEN
        v_action := 'renewed';
      ELSIF NEW.featured_priority IS DISTINCT FROM OLD.featured_priority THEN
        v_action := 'priority_changed';
      ELSE
        v_action := 'updated';
      END IF;

      INSERT INTO public.featured_audit_log (
        listing_id, actor_id, action,
        was_featured, is_featured,
        old_priority, new_priority,
        old_until, new_until
      ) VALUES (
        NEW.id, auth.uid(), v_action,
        OLD.is_featured, NEW.is_featured,
        OLD.featured_priority, NEW.featured_priority,
        OLD.featured_until, NEW.featured_until
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_featured_change ON public.listings;
CREATE TRIGGER trg_log_featured_change
AFTER UPDATE ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.log_featured_change();

-- Performance indexes for admin queries
CREATE INDEX IF NOT EXISTS idx_listings_seller ON public.listings (seller_id);
CREATE INDEX IF NOT EXISTS idx_tickets_status ON public.tickets (status);
CREATE INDEX IF NOT EXISTS idx_tickets_created ON public.tickets (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_featured_audit_created ON public.featured_audit_log (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_featured_audit_listing ON public.featured_audit_log (listing_id, created_at DESC);