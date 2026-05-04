-- Codes de récupération 2FA
CREATE TABLE IF NOT EXISTS public.admin_recovery_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  code_hash TEXT NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_recovery_codes_admin ON public.admin_recovery_codes(admin_id);

ALTER TABLE public.admin_recovery_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view own recovery codes" ON public.admin_recovery_codes;
CREATE POLICY "Admins view own recovery codes" ON public.admin_recovery_codes FOR SELECT USING (
  admin_id = (SELECT id FROM public.admin_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins manage own recovery codes" ON public.admin_recovery_codes;
CREATE POLICY "Admins manage own recovery codes" ON public.admin_recovery_codes FOR ALL USING (
  admin_id = (SELECT id FROM public.admin_users WHERE user_id = auth.uid())
) WITH CHECK (
  admin_id = (SELECT id FROM public.admin_users WHERE user_id = auth.uid())
);

-- Seeds config
INSERT INTO public.system_config (key, value, description) VALUES
  ('require_2fa_non_super_admin', '{"enabled": true}'::jsonb, '2FA obligatoire pour tous les rôles sauf super_admin'),
  ('session_duration_hours', '{"hours": 4}'::jsonb, 'Durée des sessions admin en heures')
ON CONFLICT (key) DO NOTHING;

-- RPC: log d'action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  _action_type TEXT,
  _target_type TEXT DEFAULT NULL,
  _target_id TEXT DEFAULT NULL,
  _before_state JSONB DEFAULT NULL,
  _after_state JSONB DEFAULT NULL,
  _note TEXT DEFAULT NULL,
  _ip_address TEXT DEFAULT NULL,
  _user_agent TEXT DEFAULT NULL
) RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_admin_id UUID;
  v_log_id BIGINT;
BEGIN
  SELECT id INTO v_admin_id FROM public.admin_users
  WHERE user_id = auth.uid() AND is_active = true;

  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Not an active admin';
  END IF;

  INSERT INTO public.audit_logs (
    admin_id, action_type, target_type, target_id,
    before_state, after_state, note, ip_address, user_agent
  ) VALUES (
    v_admin_id, _action_type, _target_type, _target_id,
    _before_state, _after_state, _note,
    NULLIF(_ip_address,'')::inet, _user_agent
  ) RETURNING id INTO v_log_id;

  RETURN v_log_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.log_admin_action(text,text,text,jsonb,jsonb,text,text,text) TO authenticated;

-- RPC: révoquer toutes les sessions (super_admin)
CREATE OR REPLACE FUNCTION public.revoke_all_admin_sessions()
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NOT public.is_super_admin_v2() THEN
    RAISE EXCEPTION 'Forbidden: super_admin only';
  END IF;
  WITH upd AS (
    UPDATE public.admin_sessions SET revoked_at = NOW()
    WHERE revoked_at IS NULL AND expires_at > NOW()
    RETURNING 1
  ) SELECT COUNT(*) INTO v_count FROM upd;
  RETURN v_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.revoke_all_admin_sessions() TO authenticated;

-- RPC pour activer 2FA (hash des recovery codes côté client - bcrypt non dispo, on stocke le hash SHA-256 fait côté client)
-- Note: l'app fait le hash, ici on insère seulement.