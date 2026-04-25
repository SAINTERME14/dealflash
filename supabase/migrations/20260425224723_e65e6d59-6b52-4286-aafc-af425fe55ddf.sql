-- Table de contenu éditable du site
CREATE TABLE public.site_content (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value JSONB NOT NULL DEFAULT '""'::jsonb,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  updated_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche par catégorie
CREATE INDEX idx_site_content_category ON public.site_content(category);
CREATE INDEX idx_site_content_key ON public.site_content(key);

-- RLS
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;

-- Lecture publique (textes affichés sur le site public)
CREATE POLICY "Site content is viewable by everyone"
  ON public.site_content
  FOR SELECT
  USING (true);

-- Seuls les admins peuvent créer
CREATE POLICY "Only admins can insert site content"
  ON public.site_content
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Seuls les admins peuvent modifier
CREATE POLICY "Only admins can update site content"
  ON public.site_content
  FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Seuls les admins peuvent supprimer
CREATE POLICY "Only admins can delete site content"
  ON public.site_content
  FOR DELETE
  USING (public.has_role(auth.uid(), 'admin'));

-- Trigger updated_at
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON public.site_content
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Données initiales (textes actuels du site)
INSERT INTO public.site_content (key, value, description, category) VALUES
  ('hero.title', '"Trouvez les meilleures offres au Québec"'::jsonb, 'Titre principal de la page d''accueil', 'hero'),
  ('hero.subtitle', '"Marketplace local pour produits, services, locations et événements en flash."'::jsonb, 'Sous-titre sous le titre principal', 'hero'),
  ('hero.cta_primary', '"Explorer les annonces"'::jsonb, 'Texte du bouton principal du hero', 'hero'),
  ('hero.cta_secondary', '"Devenir vendeur"'::jsonb, 'Texte du bouton secondaire du hero', 'hero'),
  ('footer.tagline', '"Le marketplace flash du Québec — économisez sur des offres locales en quantité limitée."'::jsonb, 'Slogan affiché dans le pied de page', 'footer'),
  ('footer.copyright', '"© 2026 DealFlash. Tous droits réservés."'::jsonb, 'Mention de copyright', 'footer'),
  ('footer.contact_email', '"contact@dealflash.ca"'::jsonb, 'Adresse email de contact publique', 'footer'),
  ('home.featured_section_title', '"En vedette cette semaine"'::jsonb, 'Titre de la section vedette sur la page d''accueil', 'home'),
  ('home.categories_section_title', '"Explorez par catégorie"'::jsonb, 'Titre de la section catégories', 'home'),
  ('seller.cta_banner', '"Vous avez quelque chose à vendre ? Lancez votre annonce flash en 2 minutes."'::jsonb, 'Bannière d''appel à l''action pour les vendeurs', 'cta');