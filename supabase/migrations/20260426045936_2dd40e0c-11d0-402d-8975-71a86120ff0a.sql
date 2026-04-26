-- Table des super-administrateurs (protégés)
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

-- Fonction de lecture
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.super_admins WHERE user_id = _user_id)
$$;

-- Tout le monde authentifié peut lire (pour savoir qui est super-admin)
CREATE POLICY "Anyone can view super admins"
ON public.super_admins FOR SELECT
USING (true);

-- Seuls les super-admins existants peuvent ajouter / retirer un super-admin
CREATE POLICY "Super admins manage super admins"
ON public.super_admins FOR ALL
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

-- Désigner saintermepartners@gmail.com (votre uuid existant) comme super-admin
INSERT INTO public.super_admins (user_id)
VALUES ('71c48871-5787-4022-8002-8f2cd93f1337')
ON CONFLICT (user_id) DO NOTHING;

-- Trigger : empêche de retirer le rôle admin d'un super-administrateur
CREATE OR REPLACE FUNCTION public.protect_super_admin_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'DELETE' AND OLD.role = 'admin' AND public.is_super_admin(OLD.user_id) THEN
    -- Autoriser uniquement si l'acteur est le super-admin lui-même
    IF auth.uid() IS DISTINCT FROM OLD.user_id THEN
      RAISE EXCEPTION 'Impossible de retirer le rôle admin d''un super-administrateur';
    END IF;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS protect_super_admin_role_trg ON public.user_roles;
CREATE TRIGGER protect_super_admin_role_trg
BEFORE DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.protect_super_admin_role();

-- S'assurer que le super-admin a bien le rôle admin
INSERT INTO public.user_roles (user_id, role)
VALUES ('71c48871-5787-4022-8002-8f2cd93f1337', 'admin')
ON CONFLICT DO NOTHING;