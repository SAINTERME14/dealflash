
-- Table de cache des codes d'intégration vidéo (TTL applicatif: 72h)
CREATE TABLE IF NOT EXISTS public.cache_video_embeds (
  url TEXT PRIMARY KEY,
  platform TEXT NOT NULL,
  embed_html TEXT,
  thumbnail_url TEXT,
  title TEXT,
  author_name TEXT,
  last_resolved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cache_video_embeds_resolved_at
  ON public.cache_video_embeds(last_resolved_at);

ALTER TABLE public.cache_video_embeds ENABLE ROW LEVEL SECURITY;

-- Lecture publique : les embeds vidéos sont déjà publics
CREATE POLICY "Cache video embeds publicly readable"
  ON public.cache_video_embeds FOR SELECT
  USING (true);

-- Aucune politique d'écriture : seul le service role (edge function) peut écrire

-- Table d'erreurs de résolution vidéo
CREATE TABLE IF NOT EXISTS public.errors_video_resolution (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  platform TEXT,
  error_code TEXT NOT NULL,
  error_msg TEXT,
  http_status INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_errors_video_resolution_created_at
  ON public.errors_video_resolution(created_at DESC);

ALTER TABLE public.errors_video_resolution ENABLE ROW LEVEL SECURITY;

-- Seuls les admins peuvent consulter les erreurs
CREATE POLICY "Admins view video resolution errors"
  ON public.errors_video_resolution FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));
