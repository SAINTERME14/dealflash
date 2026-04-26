-- ========================================
-- DURCISSEMENT SÉCURITÉ DEALFLASH
-- ========================================

-- 1) PROFILES : restreindre la lecture du phone
DROP POLICY IF EXISTS "Public profile fields are viewable by everyone" ON public.profiles;

-- Lecture publique des champs non sensibles (la colonne phone reste filtrée par la vue public_profiles)
CREATE POLICY "Public profile fields readable"
ON public.profiles
FOR SELECT
TO anon, authenticated
USING (true);

-- Note: la vue public_profiles masque déjà phone aux non-propriétaires/non-admins.
-- Pour une protection en profondeur, on ajoute un trigger qui empêche les apps anon
-- de lire phone via des requêtes directes en exigeant que l'app passe par la vue.
-- Solution choisie: revoke SELECT(phone) sur profiles pour anon (defense in depth)
REVOKE SELECT (phone) ON public.profiles FROM anon;

-- 2) REALTIME : ajouter RLS sur realtime.messages pour scoper les abonnements
-- Activer RLS sur realtime.messages si pas déjà fait
ALTER TABLE IF EXISTS realtime.messages ENABLE ROW LEVEL SECURITY;

-- Supprimer toute politique trop permissive existante
DROP POLICY IF EXISTS "Authenticated can subscribe to own notifications" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can subscribe to own support tickets" ON realtime.messages;
DROP POLICY IF EXISTS "Authenticated can subscribe to own messages" ON realtime.messages;

-- Politique : un utilisateur ne peut s'abonner qu'aux topics qui le concernent
CREATE POLICY "Authenticated can subscribe to own notifications"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  -- Topic format: "notifications:<user_id>" ou "user:<user_id>"
  (realtime.topic() = 'notifications:' || auth.uid()::text)
  OR (realtime.topic() = 'user:' || auth.uid()::text)
  OR (realtime.topic() = 'messages:' || auth.uid()::text)
);

-- 3) Documenter et journaliser
COMMENT ON POLICY "Public profile fields readable" ON public.profiles IS
  'Lecture publique des champs profil. La colonne phone est révoquée pour anon et masquée via la vue public_profiles.';