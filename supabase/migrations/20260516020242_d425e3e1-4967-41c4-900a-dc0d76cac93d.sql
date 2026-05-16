
CREATE OR REPLACE FUNCTION public.create_commission_on_lead_conversion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_rule public.commission_rules%ROWTYPE;
  v_amount numeric;
  v_kind public.user_type;
BEGIN
  IF NEW.status <> 'converted' OR COALESCE(OLD.status, 'scanned'::lead_status) = 'converted' THEN
    RETURN NEW;
  END IF;
  IF NEW.affiliate_user_id IS NULL OR NEW.amount_cents IS NULL OR NEW.amount_cents <= 0 THEN
    RETURN NEW;
  END IF;
  IF NEW.channel IS NULL OR NEW.channel NOT IN ('closer','influencer','promoter') THEN
    RETURN NEW;
  END IF;
  v_kind := NEW.channel::public.user_type;

  SELECT * INTO v_rule FROM public.commission_rules
   WHERE affiliate_kind = v_kind AND is_active = true
   ORDER BY updated_at DESC LIMIT 1;
  IF NOT FOUND THEN RETURN NEW; END IF;

  v_amount := (NEW.amount_cents::numeric / 100.0) * (v_rule.pct_affiliate / 100.0);

  IF EXISTS (SELECT 1 FROM public.commissions WHERE qr_conversion_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.commissions (qr_conversion_id, beneficiary_user_id, role, pct, amount, currency, status)
  VALUES (NEW.id, NEW.affiliate_user_id, v_kind, v_rule.pct_affiliate, v_amount, COALESCE(NEW.currency, 'CAD'), 'pending');

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_lead_conversion_commission ON public.leads;
CREATE TRIGGER trg_lead_conversion_commission
AFTER UPDATE OF status ON public.leads
FOR EACH ROW
EXECUTE FUNCTION public.create_commission_on_lead_conversion();
