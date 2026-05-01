-- ============================================================
-- CACHE oEmbed + LOG D'ERREURS vidéo
-- ============================================================

-- ── Table de cache ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cache_video_embeds (
  url               TEXT        PRIMARY KEY,
  platform          VARCHAR(20) NOT NULL
    CHECK (platform IN ('youtube', 'tiktok', 'instagram', 'facebook')),
  embed_html        TEXT,
  thumbnail_url     TEXT,
  title             TEXT,
  author_name       TEXT,
  last_resolved_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cache_video_platform
  ON public.cache_video_embeds(platform, last_resolved_at DESC);

ALTER TABLE public.cache_video_embeds ENABLE ROW LEVEL SECURITY;

-- Lecture publique (les embeds sont affichés à tous les visiteurs)
CREATE POLICY "Video cache is publicly readable"
  ON public.cache_video_embeds FOR SELECT USING (true);

-- Écriture réservée au service role (edge function)
CREATE POLICY "Service role writes video cache"
  ON public.cache_video_embeds FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ── Table de log d'erreurs ────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.errors_video_resolution (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  url         TEXT        NOT NULL,
  platform    VARCHAR(20),
  error_code  TEXT,
  error_msg   TEXT,
  http_status INT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_errors_video_url
  ON public.errors_video_resolution(url, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_errors_video_created
  ON public.errors_video_resolution(created_at DESC);

ALTER TABLE public.errors_video_resolution ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins view video errors"
  ON public.errors_video_resolution FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role inserts video errors"
  ON public.errors_video_resolution FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Nettoyage automatique des erreurs > 30 jours (pg_cron si disponible)
SELECT cron.schedule(
  'cleanup-video-errors',
  '0 4 * * *',
  $$ DELETE FROM public.errors_video_resolution WHERE created_at < NOW() - INTERVAL '30 days' $$
) WHERE EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron');
