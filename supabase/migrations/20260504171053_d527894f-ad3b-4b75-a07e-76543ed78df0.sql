
-- 1) Resserrer la policy "Anyone can log errors"
DROP POLICY IF EXISTS "Anyone can log errors" ON public.client_error_logs;
CREATE POLICY "Authenticated can log errors"
ON public.client_error_logs
FOR INSERT
TO authenticated
WITH CHECK (user_id IS NULL OR user_id = auth.uid());

-- 2) Révoquer EXECUTE public sur is_user_blocked
REVOKE EXECUTE ON FUNCTION public.is_user_blocked(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_user_blocked(uuid) TO authenticated;
