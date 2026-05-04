
-- 1) Fix broken WITH CHECK on advertisers update policy
DROP POLICY IF EXISTS "Advertisers update own application" ON public.seller_applications;
CREATE POLICY "Advertisers update own application"
ON public.seller_applications
FOR UPDATE
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND auth.uid() = user_id
  AND status = ANY (ARRAY['new'::seller_application_status, 'suspended'::seller_application_status])
  AND admin_response IS NULL
)
WITH CHECK (
  auth.uid() = user_id
  AND status = ANY (ARRAY['new'::seller_application_status, 'suspended'::seller_application_status])
  AND admin_response IS NULL
  AND notes IS NULL
);

-- 2) Hide internal AI review columns from applicants
REVOKE SELECT (ai_review, ai_last_run_at, ai_attempts) ON public.seller_applications FROM authenticated, anon;
GRANT SELECT (ai_review, ai_last_run_at, ai_attempts) ON public.seller_applications TO service_role;

-- 3) Realtime channel scoping for seller_applications and support_ticket_messages
DROP POLICY IF EXISTS "Scoped subscribe seller_applications channel" ON realtime.messages;
CREATE POLICY "Scoped subscribe seller_applications channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  (
    realtime.topic() LIKE 'seller_applications:%'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR public.can_manage_seller_notes(auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.seller_applications sa
        WHERE sa.user_id = auth.uid()
          AND sa.id::text = split_part(realtime.topic(), ':', 2)
      )
    )
  )
  OR (
    realtime.topic() LIKE 'support_ticket_messages:%'
    AND (
      public.has_role(auth.uid(), 'admin')
      OR EXISTS (
        SELECT 1 FROM public.support_tickets st
        WHERE st.id::text = split_part(realtime.topic(), ':', 2)
          AND st.user_id = auth.uid()
      )
    )
  )
);
