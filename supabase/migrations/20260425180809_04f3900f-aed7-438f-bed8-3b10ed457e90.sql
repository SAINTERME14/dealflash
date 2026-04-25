-- Enum for application status
CREATE TYPE public.seller_application_status AS ENUM ('new', 'contacted', 'approved', 'rejected');

-- Seller applications table
CREATE TABLE public.seller_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  listing_type public.listing_type NOT NULL,
  status public.seller_application_status NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.seller_applications ENABLE ROW LEVEL SECURITY;

-- Anyone (including anonymous) can submit a seller application
CREATE POLICY "Anyone can submit a seller application"
ON public.seller_applications
FOR INSERT
WITH CHECK (true);

-- Only admins can view, update, delete
CREATE POLICY "Admins can view all seller applications"
ON public.seller_applications
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update seller applications"
ON public.seller_applications
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete seller applications"
ON public.seller_applications
FOR DELETE
USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE TRIGGER seller_applications_updated_at
BEFORE UPDATE ON public.seller_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Index
CREATE INDEX idx_seller_applications_status ON public.seller_applications(status);
CREATE INDEX idx_seller_applications_created_at ON public.seller_applications(created_at DESC);