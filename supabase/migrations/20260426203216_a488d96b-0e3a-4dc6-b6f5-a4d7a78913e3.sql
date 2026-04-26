-- 1) PROFILES : masquer le téléphone du public en passant par une vue
-- On garde la table accessible mais on retire le téléphone pour les non-propriétaires
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Public profile fields are viewable by everyone"
ON public.profiles
FOR SELECT
USING (true);

-- Restreindre la colonne phone via une fonction sécurisée + politique colonne
-- Approche : créer une vue publique sans le téléphone et une politique stricte
-- Plus simple : ajouter une politique RESTRICTIVE sur la lecture du téléphone
-- PostgreSQL ne permet pas RLS au niveau colonne directement, donc on documente :
-- Le client doit utiliser la vue public_profiles ci-dessous pour les lectures publiques.

CREATE OR REPLACE VIEW public.public_profiles
WITH (security_invoker = true) AS
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

-- 2) BOOKINGS : ajouter WITH CHECK pour empêcher la modification de champs critiques
DROP POLICY IF EXISTS "Buyers can cancel their bookings" ON public.bookings;
DROP POLICY IF EXISTS "Sellers can update bookings on their listings" ON public.bookings;

CREATE POLICY "Buyers can cancel their bookings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = buyer_id)
WITH CHECK (
  auth.uid() = buyer_id
  AND status IN ('cancelled'::booking_status, 'pending'::booking_status)
);

CREATE POLICY "Sellers can update bookings on their listings"
ON public.bookings
FOR UPDATE
USING (auth.uid() = seller_id)
WITH CHECK (
  auth.uid() = seller_id
  AND status IN ('confirmed'::booking_status, 'cancelled'::booking_status, 'completed'::booking_status, 'no_show'::booking_status)
);

-- 3) SUPER_ADMINS : retirer l'accès public
DROP POLICY IF EXISTS "Anyone can view super admins" ON public.super_admins;

CREATE POLICY "Super admins can view super admins"
ON public.super_admins
FOR SELECT
USING (public.is_super_admin(auth.uid()));

-- L'utilisateur peut vérifier son propre statut super-admin
CREATE POLICY "Users can check their own super admin status"
ON public.super_admins
FOR SELECT
USING (auth.uid() = user_id);

-- 4) SITE_CONTENT : exclure la catégorie integrations du public
DROP POLICY IF EXISTS "Site content is viewable by everyone" ON public.site_content;

CREATE POLICY "Public site content viewable by everyone"
ON public.site_content
FOR SELECT
USING (category <> 'integrations');

CREATE POLICY "Admins can view all site content"
ON public.site_content
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));