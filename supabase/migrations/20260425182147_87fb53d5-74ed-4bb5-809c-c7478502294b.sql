-- Audit log table for seller applications status changes
CREATE TABLE public.seller_application_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.seller_applications(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_role public.app_role,
  action TEXT NOT NULL,
  old_status public.seller_application_status,
  new_status public.seller_application_status,
  notes_changed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_application_audit_log ENABLE ROW LEVEL SECURITY;

-- Only authorized roles can view audit log
CREATE POLICY "Authorized roles can view audit log"
ON public.seller_application_audit_log
FOR SELECT
USING (public.can_manage_seller_notes(auth.uid()));

-- No direct INSERT/UPDATE/DELETE from clients (only the trigger writes, as SECURITY DEFINER)

CREATE INDEX idx_seller_app_audit_app_id ON public.seller_application_audit_log(application_id, created_at DESC);
CREATE INDEX idx_seller_app_audit_created_at ON public.seller_application_audit_log(created_at DESC);

-- Helper: pick the highest-priority role for a user (admin > vendeur_b2c > vendeur_c2c > acheteur)
CREATE OR REPLACE FUNCTION public.get_primary_role(_user_id uuid)
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.user_roles
  WHERE user_id = _user_id
  ORDER BY CASE role
    WHEN 'admin' THEN 1
    WHEN 'vendeur_b2c' THEN 2
    WHEN 'vendeur_c2c' THEN 3
    WHEN 'acheteur' THEN 4
  END
  LIMIT 1
$$;

-- Trigger function: log status / notes changes
CREATE OR REPLACE FUNCTION public.log_seller_application_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
  v_status_changed BOOLEAN;
  v_notes_changed BOOLEAN;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.seller_application_audit_log (
      application_id, actor_id, actor_role, action,
      old_status, new_status, notes_changed
    ) VALUES (
      NEW.id, NULL, NULL, 'created',
      NULL, NEW.status, false
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    v_status_changed := NEW.status IS DISTINCT FROM OLD.status;
    v_notes_changed := NEW.notes IS DISTINCT FROM OLD.notes;

    IF v_status_changed THEN
      v_action := 'status_changed';
    ELSIF v_notes_changed THEN
      v_action := 'notes_updated';
    ELSE
      RETURN NEW;
    END IF;

    INSERT INTO public.seller_application_audit_log (
      application_id, actor_id, actor_role, action,
      old_status, new_status, notes_changed
    ) VALUES (
      NEW.id,
      auth.uid(),
      public.get_primary_role(auth.uid()),
      v_action,
      OLD.status,
      NEW.status,
      v_notes_changed
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_seller_application_audit
AFTER INSERT OR UPDATE ON public.seller_applications
FOR EACH ROW
EXECUTE FUNCTION public.log_seller_application_change();