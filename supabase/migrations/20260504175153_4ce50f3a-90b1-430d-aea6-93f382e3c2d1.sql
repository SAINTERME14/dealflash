
-- Deny non-privileged users access to internal admin notes column
REVOKE SELECT (notes) ON public.seller_applications FROM authenticated, anon;
GRANT SELECT (notes) ON public.seller_applications TO service_role;

-- Realtime channel scoping for advertiser apps and support tickets
DROP POLICY IF EXISTS "Advertisers subscribe to own application channel" ON realtime.messages;
CREATE POLICY "Advertisers subscribe to own application channel"
ON realtime.messages
FOR SELECT
TO authenticated
USING (
  realtime.topic() = 'advertiser-apps-' || (auth.uid())::text
  OR (
    realtime.topic() LIKE 'support-%'
    AND EXISTS (
      SELECT 1 FROM public.support_tickets st
      WHERE st.id::text = substring(realtime.topic() from 9)
        AND (st.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  OR public.has_role(auth.uid(), 'admin')
);
