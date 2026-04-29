-- Add advertiser-profile type
DO $$ BEGIN
  CREATE TYPE public.advertiser_profile AS ENUM ('particulier','pro_occasionnel','commerce','pro_reglemente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS advertiser_profile public.advertiser_profile,
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS neq_number text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS main_category text,
  ADD COLUMN IF NOT EXISTS message text;

-- Replace public insert policy to allow new fields and require profile
DROP POLICY IF EXISTS "Anyone can submit a valid seller application" ON public.seller_applications;

CREATE POLICY "Anyone can submit a valid seller application"
ON public.seller_applications
FOR INSERT
TO public
WITH CHECK (
  status = 'new'::seller_application_status
  AND notes IS NULL
  AND length(btrim(name)) BETWEEN 2 AND 100
  AND length(btrim(email)) BETWEEN 5 AND 255
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  AND listing_type = ANY (ARRAY['product'::listing_type,'vehicle'::listing_type,'rental'::listing_type,'hotel'::listing_type,'service'::listing_type])
  AND (advertiser_profile IS NULL OR advertiser_profile IN ('particulier','pro_occasionnel','commerce','pro_reglemente'))
  AND (phone IS NULL OR length(phone) <= 30)
  AND (city IS NULL OR length(city) <= 100)
  AND (business_name IS NULL OR length(business_name) <= 150)
  AND (neq_number IS NULL OR length(neq_number) <= 30)
  AND (profession IS NULL OR length(profession) <= 100)
  AND (license_number IS NULL OR length(license_number) <= 60)
  AND (main_category IS NULL OR length(main_category) <= 80)
  AND (message IS NULL OR length(message) <= 2000)
);