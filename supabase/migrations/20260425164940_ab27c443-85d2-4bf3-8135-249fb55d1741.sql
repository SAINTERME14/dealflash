-- Enable extensions needed to schedule the cleanup job
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Function: clear featured flag on listings whose featured_until has passed.
-- SECURITY DEFINER so it can bypass the guard_featured_fields trigger that
-- restricts edits to admins only — system-driven expiration must always succeed.
CREATE OR REPLACE FUNCTION public.expire_featured_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  WITH updated AS (
    UPDATE public.listings
    SET
      is_featured = false,
      featured_priority = 0,
      featured_until = NULL,
      updated_at = now()
    WHERE
      featured_until IS NOT NULL
      AND featured_until < now()
      AND (is_featured = true OR featured_priority <> 0)
    RETURNING 1
  )
  SELECT count(*) INTO affected FROM updated;

  RETURN COALESCE(affected, 0);
END;
$$;

-- Allow the system / edge functions to invoke it
REVOKE ALL ON FUNCTION public.expire_featured_listings() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.expire_featured_listings() TO service_role;