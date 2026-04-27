BEGIN;

DROP POLICY IF EXISTS "Public profile fields readable" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  id,
  user_id,
  display_name,
  avatar_url,
  bio,
  city,
  is_verified,
  created_at,
  updated_at,
  CASE
    WHEN auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') THEN phone
    ELSE NULL
  END AS phone
FROM public.profiles;

GRANT SELECT ON public.public_profiles TO anon, authenticated;

DROP POLICY IF EXISTS "Users post messages on their tickets" ON public.support_ticket_messages;

CREATE POLICY "Users post messages on their tickets"
ON public.support_ticket_messages
FOR INSERT
WITH CHECK (
  auth.uid() = author_id
  AND EXISTS (
    SELECT 1
    FROM public.support_tickets t
    WHERE t.id = support_ticket_messages.ticket_id
      AND (
        t.user_id = auth.uid()
        OR public.has_role(auth.uid(), 'admin')
      )
  )
  AND (
    is_admin_reply = false
    OR public.has_role(auth.uid(), 'admin')
  )
);

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.can_publish_listings(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_primary_role(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_manage_seller_notes(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.set_vault_service_role_key(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.get_listing_rating_stats(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_seller_rating_stats(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_super_admin(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.expire_featured_listings() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_dropship_order_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_seller_application_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_dealflash_to_listing() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_seller_verification_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.assign_vendor_role_on_approval() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.trigger_cj_auto_place_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_reviews_updated_at() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_seller_on_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_super_admin_role() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_dealflash_product_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.log_featured_change() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_dropship_order_from_ticket() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_listing_rating_stats(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_rating_stats(uuid) TO authenticated;

COMMIT;