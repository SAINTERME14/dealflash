INSERT INTO public.site_content (key, value, description, category) VALUES
('announcement.enabled', 'false'::jsonb, 'Activer/désactiver la bande défilante (true ou false)', 'announcement'),
('announcement.message', '"Ce site est en construction"'::jsonb, 'Message affiché dans la bande défilante en haut du site', 'announcement')
ON CONFLICT (key) DO NOTHING;