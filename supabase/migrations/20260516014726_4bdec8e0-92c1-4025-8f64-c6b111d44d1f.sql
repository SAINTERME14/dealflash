-- Lock down legacy affiliate_* tables (unused by current leads/QR system) with RLS admin-only
ALTER TABLE public.affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payout_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commission_tiers ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'affiliate_clicks','affiliate_commissions','affiliate_conversions',
    'affiliate_links','affiliate_payout_history','affiliate_payouts','commission_tiers'
  ] LOOP
    EXECUTE format('DROP POLICY IF EXISTS "admin_full_%I" ON public.%I', t, t);
    EXECUTE format(
      'CREATE POLICY "admin_full_%I" ON public.%I FOR ALL TO authenticated USING (has_role(auth.uid(),''admin''::app_role)) WITH CHECK (has_role(auth.uid(),''admin''::app_role))',
      t, t
    );
  END LOOP;
END $$;