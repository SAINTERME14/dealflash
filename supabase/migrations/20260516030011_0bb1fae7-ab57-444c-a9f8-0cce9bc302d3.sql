
-- KYC gate: empêcher l'approbation/paiement d'une commission sans KYC validé.
CREATE OR REPLACE FUNCTION public.has_approved_kyc(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.seller_verifications
     WHERE user_id = _user_id AND status = 'approved'
  ) OR EXISTS (
    SELECT 1 FROM public.affiliate_profiles
     WHERE user_id = _user_id AND is_active = true AND kyc_status = 'approved'
  );
$$;

CREATE OR REPLACE FUNCTION public.guard_commission_kyc()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IN ('approved','paid')
     AND (OLD.status IS DISTINCT FROM NEW.status)
     AND NOT public.has_approved_kyc(NEW.beneficiary_user_id) THEN
    RAISE EXCEPTION 'KYC non validé pour le bénéficiaire % — versement impossible', NEW.beneficiary_user_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_commission_kyc_gate ON public.commissions;
CREATE TRIGGER trg_commission_kyc_gate
  BEFORE UPDATE OF status ON public.commissions
  FOR EACH ROW EXECUTE FUNCTION public.guard_commission_kyc();
