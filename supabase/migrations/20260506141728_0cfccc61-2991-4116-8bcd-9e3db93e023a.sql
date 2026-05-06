DO $$ BEGIN
  CREATE TYPE public.advertiser_profile AS ENUM ('particulier','pro_occasionnel','commerce','pro_reglemente');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.seller_application_status AS ENUM ('new','pending','approved','rejected','needs_info');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS user_id uuid,
  ADD COLUMN IF NOT EXISTS advertiser_profile public.advertiser_profile,
  ADD COLUMN IF NOT EXISTS business_name text,
  ADD COLUMN IF NOT EXISTS neq_number text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS main_category text,
  ADD COLUMN IF NOT EXISTS message text,
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS listing_type listing_type,
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS admin_response text,
  ADD COLUMN IF NOT EXISTS photos text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS documents text[] DEFAULT '{}';