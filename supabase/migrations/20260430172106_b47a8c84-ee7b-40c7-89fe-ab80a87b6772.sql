
-- 1) Add 'moderateur' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderateur';

-- 2) Add 'suspended' status to seller_application_status
ALTER TYPE public.seller_application_status ADD VALUE IF NOT EXISTS 'suspended';
