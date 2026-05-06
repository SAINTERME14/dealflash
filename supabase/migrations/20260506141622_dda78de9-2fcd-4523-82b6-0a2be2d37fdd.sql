ALTER TABLE public.professional_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active services" ON public.professional_services
  FOR SELECT USING (status = 'active' OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage services" ON public.professional_services
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));

ALTER TABLE public.boutiques ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public view active boutiques" ON public.boutiques
  FOR SELECT USING (status = 'active' OR has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage boutiques" ON public.boutiques
  FOR ALL USING (has_role(auth.uid(), 'admin')) WITH CHECK (has_role(auth.uid(), 'admin'));