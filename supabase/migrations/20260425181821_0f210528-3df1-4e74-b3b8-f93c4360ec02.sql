-- Security definer function: who can manage seller applications & internal notes
CREATE OR REPLACE FUNCTION public.can_manage_seller_notes(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'vendeur_b2c')
  )
$$;

-- Drop old admin-only policies
DROP POLICY IF EXISTS "Admins can view all seller applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can update seller applications" ON public.seller_applications;
DROP POLICY IF EXISTS "Admins can delete seller applications" ON public.seller_applications;

-- New policies: admins + vendeur_b2c can view & update (incl. notes)
CREATE POLICY "Authorized roles can view seller applications"
ON public.seller_applications
FOR SELECT
USING (public.can_manage_seller_notes(auth.uid()));

CREATE POLICY "Authorized roles can update seller applications"
ON public.seller_applications
FOR UPDATE
USING (public.can_manage_seller_notes(auth.uid()));

-- Deletion stays admin-only (more sensitive)
CREATE POLICY "Admins can delete seller applications"
ON public.seller_applications
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));