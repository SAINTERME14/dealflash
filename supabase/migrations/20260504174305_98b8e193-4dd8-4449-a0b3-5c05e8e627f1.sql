
-- 1) Restrict allowed MIME types at the storage infrastructure level
UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','image/gif','image/avif']
WHERE id IN ('listings','avatars');

UPDATE storage.buckets
SET allowed_mime_types = ARRAY['image/jpeg','image/png','image/webp','application/pdf']
WHERE id IN ('kyc-documents','advertiser-uploads');

-- 2) Fix self-referencing bug in advertiser update policy on seller_applications
DROP POLICY IF EXISTS "Advertisers update own application" ON public.seller_applications;

CREATE POLICY "Advertisers update own application"
ON public.seller_applications
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND status IN ('new'::seller_application_status, 'suspended'::seller_application_status)
  AND admin_response IS NULL
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('new'::seller_application_status, 'suspended'::seller_application_status)
  AND admin_response IS NULL
  AND notes IS NULL
);
