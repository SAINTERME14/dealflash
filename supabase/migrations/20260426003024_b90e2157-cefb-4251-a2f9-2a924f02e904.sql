-- 1. Enums for KYC system
CREATE TYPE public.seller_verification_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'more_info_required',
  'approved',
  'rejected'
);

CREATE TYPE public.seller_profile_type AS ENUM (
  'individual',
  'self_employed',
  'corporation'
);

CREATE TYPE public.kyc_document_type AS ENUM (
  'gov_id_front',
  'gov_id_back',
  'selfie_with_id',
  'proof_of_address',
  'business_registration',
  'tax_certificate_neq',
  'tax_certificate_bn',
  'tax_certificate_gst_qst',
  'work_authorization',
  'professional_license',
  'other'
);

CREATE TYPE public.kyc_document_status AS ENUM (
  'pending',
  'accepted',
  'rejected'
);

-- 2. seller_verifications table
CREATE TABLE public.seller_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,

  -- Profile type
  profile_type public.seller_profile_type NOT NULL DEFAULT 'individual',

  -- Mandatory contact info
  legal_first_name TEXT,
  legal_last_name TEXT,
  legal_business_name TEXT,
  email TEXT NOT NULL,
  phone TEXT,
  address_line1 TEXT,
  address_line2 TEXT,
  city TEXT,
  province TEXT,
  postal_code TEXT,
  country TEXT NOT NULL DEFAULT 'CA',

  -- Tax / business identifiers
  neq_number TEXT,
  business_number TEXT,
  gst_number TEXT,
  qst_number TEXT,

  -- Workflow
  status public.seller_verification_status NOT NULL DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,

  -- Notes
  internal_notes TEXT,
  rejection_reason TEXT,

  -- Acknowledgement
  consent_terms BOOLEAN NOT NULL DEFAULT false,
  consent_data_processing BOOLEAN NOT NULL DEFAULT false,

  data_retention_until TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_seller_verifications_user_id ON public.seller_verifications(user_id);
CREATE INDEX idx_seller_verifications_status ON public.seller_verifications(status);

ALTER TABLE public.seller_verifications ENABLE ROW LEVEL SECURITY;

-- Vendor can view their own verification
CREATE POLICY "Users view their own verification"
ON public.seller_verifications
FOR SELECT
USING (auth.uid() = user_id);

-- Admins can view all verifications
CREATE POLICY "Admins view all verifications"
ON public.seller_verifications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Vendor can create their own verification
CREATE POLICY "Users create their own verification"
ON public.seller_verifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Vendor can update their own verification only when editable
CREATE POLICY "Users update their own verification when editable"
ON public.seller_verifications
FOR UPDATE
USING (
  auth.uid() = user_id
  AND status IN ('draft', 'more_info_required')
)
WITH CHECK (
  auth.uid() = user_id
  AND status IN ('draft', 'submitted', 'more_info_required')
);

-- Admins can update any verification
CREATE POLICY "Admins update all verifications"
ON public.seller_verifications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_seller_verifications_updated_at
BEFORE UPDATE ON public.seller_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. seller_verification_documents table
CREATE TABLE public.seller_verification_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES public.seller_verifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,

  document_type public.kyc_document_type NOT NULL,
  storage_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,

  status public.kyc_document_status NOT NULL DEFAULT 'pending',
  review_note TEXT,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_docs_verification_id ON public.seller_verification_documents(verification_id);
CREATE INDEX idx_kyc_docs_user_id ON public.seller_verification_documents(user_id);

ALTER TABLE public.seller_verification_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view their own kyc documents"
ON public.seller_verification_documents
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins view all kyc documents"
ON public.seller_verification_documents
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users insert their own kyc documents"
ON public.seller_verification_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete their own pending kyc documents"
ON public.seller_verification_documents
FOR DELETE
USING (
  auth.uid() = user_id
  AND status = 'pending'
  AND EXISTS (
    SELECT 1 FROM public.seller_verifications v
    WHERE v.id = verification_id
      AND v.status IN ('draft', 'more_info_required')
  )
);

CREATE POLICY "Admins update kyc documents"
ON public.seller_verification_documents
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete kyc documents"
ON public.seller_verification_documents
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_kyc_documents_updated_at
BEFORE UPDATE ON public.seller_verification_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. seller_verification_audit_log
CREATE TABLE public.seller_verification_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_id UUID NOT NULL REFERENCES public.seller_verifications(id) ON DELETE CASCADE,
  actor_id UUID,
  actor_role public.app_role,
  action TEXT NOT NULL,
  old_status public.seller_verification_status,
  new_status public.seller_verification_status,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_kyc_audit_verification_id ON public.seller_verification_audit_log(verification_id);

ALTER TABLE public.seller_verification_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view kyc audit log"
ON public.seller_verification_audit_log
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users view their own kyc audit log"
ON public.seller_verification_audit_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.seller_verifications v
    WHERE v.id = verification_id
      AND v.user_id = auth.uid()
  )
);

-- 5. Audit trigger
CREATE OR REPLACE FUNCTION public.log_seller_verification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_action TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.seller_verification_audit_log (
      verification_id, actor_id, actor_role, action, old_status, new_status
    ) VALUES (
      NEW.id, NEW.user_id, public.get_primary_role(NEW.user_id), 'created', NULL, NEW.status
    );
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      v_action := 'status_changed';
    ELSE
      RETURN NEW;
    END IF;

    INSERT INTO public.seller_verification_audit_log (
      verification_id, actor_id, actor_role, action, old_status, new_status, notes
    ) VALUES (
      NEW.id,
      auth.uid(),
      public.get_primary_role(auth.uid()),
      v_action,
      OLD.status,
      NEW.status,
      CASE WHEN NEW.status = 'rejected' THEN NEW.rejection_reason ELSE NULL END
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_seller_verification
AFTER INSERT OR UPDATE ON public.seller_verifications
FOR EACH ROW
EXECUTE FUNCTION public.log_seller_verification_change();

-- 6. Auto-assign vendor role when approved
CREATE OR REPLACE FUNCTION public.assign_vendor_role_on_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status <> 'approved') THEN
    -- Assign vendeur_b2c role if corporation, else vendeur_c2c
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.user_id,
      CASE
        WHEN NEW.profile_type = 'corporation' THEN 'vendeur_b2c'::app_role
        ELSE 'vendeur_c2c'::app_role
      END
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_assign_vendor_role
AFTER UPDATE ON public.seller_verifications
FOR EACH ROW
EXECUTE FUNCTION public.assign_vendor_role_on_approval();

-- 7. Helper function to check if user can publish listings
CREATE OR REPLACE FUNCTION public.can_publish_listings(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.seller_verifications
    WHERE user_id = _user_id
      AND status = 'approved'
  ) OR public.has_role(_user_id, 'admin');
$$;

-- 8. Storage bucket for KYC documents (PRIVATE)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS: vendor can upload to their own folder {user_id}/...
CREATE POLICY "Users upload their own kyc files"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vendor can read their own kyc files
CREATE POLICY "Users read their own kyc files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Vendor can delete their own kyc files
CREATE POLICY "Users delete their own kyc files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'kyc-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admins can read all kyc files
CREATE POLICY "Admins read all kyc files"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'kyc-documents'
  AND public.has_role(auth.uid(), 'admin')
);

-- Admins can delete kyc files
CREATE POLICY "Admins delete all kyc files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'kyc-documents'
  AND public.has_role(auth.uid(), 'admin')
);