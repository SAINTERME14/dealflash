-- Nettoyage complet du compte saintermepartners@gmail.com pour permettre une réinscription propre
DO $$
DECLARE
  v_user_id UUID := '48b0c0d2-96ac-4471-bba0-7c59c501e7d0';
BEGIN
  DELETE FROM public.user_roles WHERE user_id = v_user_id;
  DELETE FROM public.profiles WHERE user_id = v_user_id;
  DELETE FROM public.notifications WHERE user_id = v_user_id;
  DELETE FROM public.favorites WHERE user_id = v_user_id;
  DELETE FROM auth.users WHERE id = v_user_id;
END $$;