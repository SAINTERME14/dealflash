ALTER TABLE public.seller_applications
  ADD COLUMN IF NOT EXISTS admin_response_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS ai_review jsonb,
  ADD COLUMN IF NOT EXISTS ai_attempts integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS ai_last_run_at timestamp with time zone;