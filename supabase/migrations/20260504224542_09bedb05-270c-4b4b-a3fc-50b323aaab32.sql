-- 1. ENUM admin_role
DO $$ BEGIN
  CREATE TYPE public.admin_role AS ENUM (
    'super_admin', 'admin', 'moderator', 'support',
    'marketing', 'accountant', 'hr', 'analyst'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2. admin_users
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.admin_role NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  two_fa_enabled BOOLEAN NOT NULL DEFAULT false,
  two_fa_secret TEXT,
  last_login_at TIMESTAMPTZ,
  last_login_ip INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  deactivated_at TIMESTAMPTZ,
  deactivated_by UUID REFERENCES auth.users(id),
  notes TEXT,
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON public.admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON public.admin_users(role) WHERE is_active = true;

-- 3. audit_logs (immuable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id BIGSERIAL PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES public.admin_users(id),
  action_type TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  before_state JSONB,
  after_state JSONB,
  note TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target ON public.audit_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action_type, created_at DESC);

CREATE OR REPLACE FUNCTION public.prevent_audit_log_modification()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs are immutable';
END;
$$;

DROP TRIGGER IF EXISTS audit_logs_no_update ON public.audit_logs;
CREATE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

DROP TRIGGER IF EXISTS audit_logs_no_delete ON public.audit_logs;
CREATE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_log_modification();

-- 4. admin_sessions
CREATE TABLE IF NOT EXISTS public.admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES public.admin_users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  two_fa_verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin ON public.admin_sessions(admin_id) WHERE revoked_at IS NULL;

-- 5. system_config
CREATE TABLE IF NOT EXISTS public.system_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_by UUID REFERENCES public.admin_users(id),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.system_config (key, value, description) VALUES
  ('maintenance_mode', '{"enabled": false, "message": null}'::jsonb, 'Mode maintenance global'),
  ('signup_enabled', '{"enabled": true}'::jsonb, 'Inscriptions ouvertes'),
  ('listing_creation_enabled', '{"enabled": true}'::jsonb, 'Creation d annonces autorisee')
ON CONFLICT (key) DO NOTHING;

-- 6. Fonctions utilitaires (nouvelles, ne touchent pas aux fonctions existantes)
CREATE OR REPLACE FUNCTION public.is_admin(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = check_user_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION public.get_admin_role(check_user_id UUID DEFAULT auth.uid())
RETURNS public.admin_role LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT role FROM public.admin_users
  WHERE user_id = check_user_id AND is_active = true
  LIMIT 1;
$$;

-- Renommée pour éviter conflit avec is_super_admin(uuid) existant lié à super_admins
CREATE OR REPLACE FUNCTION public.is_super_admin_v2(check_user_id UUID DEFAULT auth.uid())
RETURNS BOOLEAN LANGUAGE SQL STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admin_users
    WHERE user_id = check_user_id
      AND role = 'super_admin'
      AND is_active = true
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_admin(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_admin_role(uuid) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin_v2(uuid) TO authenticated, anon;

-- 7. RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view admin list" ON public.admin_users;
CREATE POLICY "Admins can view admin list" ON public.admin_users FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins can insert admins" ON public.admin_users;
CREATE POLICY "Super admins can insert admins" ON public.admin_users FOR INSERT WITH CHECK (public.is_super_admin_v2());

DROP POLICY IF EXISTS "Super admins can update admins" ON public.admin_users;
CREATE POLICY "Super admins can update admins" ON public.admin_users FOR UPDATE USING (public.is_super_admin_v2());

DROP POLICY IF EXISTS "Admins can view logs" ON public.audit_logs;
CREATE POLICY "Admins can view logs" ON public.audit_logs FOR SELECT USING (
  public.is_super_admin_v2()
  OR admin_id = (SELECT id FROM public.admin_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can insert logs" ON public.audit_logs;
CREATE POLICY "Admins can insert logs" ON public.audit_logs FOR INSERT WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "View own sessions or all if super admin" ON public.admin_sessions;
CREATE POLICY "View own sessions or all if super admin" ON public.admin_sessions FOR SELECT USING (
  public.is_super_admin_v2()
  OR admin_id = (SELECT id FROM public.admin_users WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Admins can manage sessions" ON public.admin_sessions;
CREATE POLICY "Admins can manage sessions" ON public.admin_sessions FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can view config" ON public.system_config;
CREATE POLICY "Admins can view config" ON public.system_config FOR SELECT USING (public.is_admin());

DROP POLICY IF EXISTS "Super admins can update config" ON public.system_config;
CREATE POLICY "Super admins can update config" ON public.system_config FOR UPDATE USING (public.is_super_admin_v2());

-- 8. Seed: inscrire les super_admins existants comme super_admin dans admin_users
INSERT INTO public.admin_users (user_id, role, is_active)
SELECT s.user_id, 'super_admin'::public.admin_role, true
FROM public.super_admins s
ON CONFLICT (user_id) DO UPDATE
  SET role = 'super_admin', is_active = true;