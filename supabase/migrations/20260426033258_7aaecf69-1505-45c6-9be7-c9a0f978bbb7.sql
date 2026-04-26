
CREATE OR REPLACE FUNCTION public.set_vault_service_role_key(_key TEXT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, vault
AS $$
DECLARE
  v_secret_id UUID;
BEGIN
  -- Sécurité: seulement admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Forbidden: admin only';
  END IF;

  IF _key IS NULL OR length(_key) < 20 THEN
    RAISE EXCEPTION 'Clé invalide';
  END IF;

  SELECT id INTO v_secret_id FROM vault.secrets WHERE name = 'service_role_key';

  IF v_secret_id IS NULL THEN
    PERFORM vault.create_secret(_key, 'service_role_key', 'Service role key utilisée par les triggers et crons');
  ELSE
    PERFORM vault.update_secret(v_secret_id, _key);
  END IF;
END;
$$;

REVOKE ALL ON FUNCTION public.set_vault_service_role_key(TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.set_vault_service_role_key(TEXT) TO authenticated;
