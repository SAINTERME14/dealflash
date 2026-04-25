-- ============================================================
-- 1) Move pg_net out of `public` into a dedicated `extensions` schema
--    pg_net doesn't support ALTER ... SET SCHEMA, so drop + recreate.
-- ============================================================
CREATE SCHEMA IF NOT EXISTS extensions;
DROP EXTENSION IF EXISTS pg_net;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- ============================================================
-- 2) Tighten the "Anyone can submit a seller application" policy
-- ============================================================
DROP POLICY IF EXISTS "Anyone can submit a seller application" ON public.seller_applications;

CREATE POLICY "Anyone can submit a valid seller application"
ON public.seller_applications
FOR INSERT
WITH CHECK (
  status = 'new'
  AND notes IS NULL
  AND length(btrim(name)) BETWEEN 2 AND 100
  AND length(btrim(email)) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND listing_type IN ('product','vehicle','rental','hotel','service')
);

-- ============================================================
-- 3 & 4) Storage buckets: prevent LIST API while keeping public reads.
--        Public HTTP endpoint (/storage/v1/object/public/...) bypasses RLS,
--        so files in public buckets remain viewable via direct URL.
-- ============================================================
DROP POLICY IF EXISTS "Listing images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Avatars are publicly accessible" ON storage.objects;

CREATE POLICY "Listing images: owner-only API read"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'listings'
  AND (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND (auth.uid())::text = (storage.foldername(name))[1])
  )
);

CREATE POLICY "Avatars: owner-only API read"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'avatars'
  AND (
    auth.role() = 'service_role'
    OR (auth.uid() IS NOT NULL AND (auth.uid())::text = (storage.foldername(name))[1])
  )
);