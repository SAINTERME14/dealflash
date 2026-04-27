BEGIN;

DROP VIEW IF EXISTS public.public_profiles;

CREATE VIEW public.public_profiles
WITH (security_invoker=on) AS
SELECT
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  city,
  is_verified,
  created_at,
  updated_at
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_listing_rating_stats(uuid) FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.get_seller_rating_stats(uuid) FROM authenticated;

COMMIT;