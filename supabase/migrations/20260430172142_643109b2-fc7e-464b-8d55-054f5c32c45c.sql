
-- 1) New columns on seller_applications
ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS photos text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS documents text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_review jsonb,
  ADD COLUMN IF NOT EXISTS ai_attempts integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_response text,
  ADD COLUMN IF NOT EXISTS admin_response_at timestamptz;

-- 2) Update can_manage_seller_notes to include moderateur
CREATE OR REPLACE FUNCTION public.can_manage_seller_notes(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'vendeur_b2c', 'moderateur')
  )
$function$;

-- 3) Allow advertisers to view & update their own applications
DROP POLICY IF EXISTS "Advertisers view own application" ON public.seller_applications;
CREATE POLICY "Advertisers view own application"
ON public.seller_applications
FOR SELECT
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

DROP POLICY IF EXISTS "Advertisers update own application" ON public.seller_applications;
CREATE POLICY "Advertisers update own application"
ON public.seller_applications
FOR UPDATE
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- L'annonceur ne peut pas se réapprouver: status reste piloté par l'équipe.
  AND status IN ('new', 'suspended')
  AND admin_response IS NULL OR admin_response = (
    SELECT admin_response FROM public.seller_applications WHERE id = seller_applications.id
  )
);

-- 4) Realtime
ALTER TABLE public.seller_applications REPLICA IDENTITY FULL;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'seller_applications'
  ) THEN
    EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.seller_applications';
  END IF;
END $$;

-- 5) Storage bucket for advertiser photos & docs
INSERT INTO storage.buckets (id, name, public)
VALUES ('advertiser-uploads', 'advertiser-uploads', false)
ON CONFLICT (id) DO NOTHING;

-- Policies on storage.objects scoped to this bucket; folder = user_id
DROP POLICY IF EXISTS "Advertisers upload own files" ON storage.objects;
CREATE POLICY "Advertisers upload own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'advertiser-uploads'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

DROP POLICY IF EXISTS "Advertisers read own files" ON storage.objects;
CREATE POLICY "Advertisers read own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'advertiser-uploads'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.can_manage_seller_notes(auth.uid())
  )
);

DROP POLICY IF EXISTS "Advertisers delete own files" ON storage.objects;
CREATE POLICY "Advertisers delete own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'advertiser-uploads'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.can_manage_seller_notes(auth.uid())
  )
);
