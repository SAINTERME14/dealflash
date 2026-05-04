GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_user_blocked(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_seller_notes(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_publish_listings(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_primary_role(uuid) TO authenticated;