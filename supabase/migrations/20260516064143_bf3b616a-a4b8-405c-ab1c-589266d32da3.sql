
-- 1. Dropship shops (WED2C-style)
CREATE TABLE public.dropship_shops (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL,
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  niche text,
  description text,
  logo_url text,
  cover_url text,
  market_id uuid,
  currency text NOT NULL DEFAULT 'CAD',
  management_mode text NOT NULL DEFAULT 'self' CHECK (management_mode IN ('self','managed')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','active','paused','suspended')),
  managed_plan text,
  managed_started_at timestamptz,
  ai_autopilot_enabled boolean NOT NULL DEFAULT false,
  default_margin_pct numeric(5,2) NOT NULL DEFAULT 40.00,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dropship_shops_owner ON public.dropship_shops(owner_user_id);
CREATE INDEX idx_dropship_shops_status ON public.dropship_shops(status);

ALTER TABLE public.dropship_shops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owners manage their shops" ON public.dropship_shops
  FOR ALL USING (auth.uid() = owner_user_id) WITH CHECK (auth.uid() = owner_user_id);
CREATE POLICY "Admins full access shops" ON public.dropship_shops
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public can view active shops" ON public.dropship_shops
  FOR SELECT USING (status = 'active');

-- 2. Shop products (imported from supplier_products)
CREATE TABLE public.dropship_shop_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id uuid NOT NULL REFERENCES public.dropship_shops(id) ON DELETE CASCADE,
  supplier_product_id uuid REFERENCES public.supplier_products(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  images text[] NOT NULL DEFAULT '{}'::text[],
  cost_price numeric(12,2) NOT NULL DEFAULT 0,
  sale_price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'CAD',
  category text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','draft','archived')),
  ai_generated boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_dsp_shop ON public.dropship_shop_products(shop_id);
ALTER TABLE public.dropship_shop_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner manages products" ON public.dropship_shop_products
  FOR ALL USING (EXISTS (SELECT 1 FROM public.dropship_shops s WHERE s.id = shop_id AND s.owner_user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.dropship_shops s WHERE s.id = shop_id AND s.owner_user_id = auth.uid()));
CREATE POLICY "Admins full access products" ON public.dropship_shop_products
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Public can view active products" ON public.dropship_shop_products
  FOR SELECT USING (status = 'active' AND EXISTS (SELECT 1 FROM public.dropship_shops s WHERE s.id = shop_id AND s.status = 'active'));

-- 3. Trending products (AI-detected)
CREATE TABLE public.trending_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_product_id uuid REFERENCES public.supplier_products(id) ON DELETE CASCADE,
  external_sku text,
  title text NOT NULL,
  category text,
  trend_score numeric(5,2) NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'ai',
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  recommended_price numeric(12,2),
  currency text NOT NULL DEFAULT 'CAD',
  detected_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb
);
CREATE INDEX idx_trending_score ON public.trending_products(trend_score DESC);
CREATE INDEX idx_trending_cat ON public.trending_products(category);
ALTER TABLE public.trending_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read trending" ON public.trending_products
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins manage trending" ON public.trending_products
  FOR ALL USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. AI assistant conversations
CREATE TABLE public.ai_assistant_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  shop_id uuid REFERENCES public.dropship_shops(id) ON DELETE SET NULL,
  title text NOT NULL DEFAULT 'Nouvelle conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_assistant_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User owns conversations" ON public.ai_assistant_conversations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins read conversations" ON public.ai_assistant_conversations
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.ai_assistant_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.ai_assistant_conversations(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('user','assistant','system','tool')),
  content text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_aim_conv ON public.ai_assistant_messages(conversation_id, created_at);
ALTER TABLE public.ai_assistant_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "User reads own messages" ON public.ai_assistant_messages
  FOR SELECT USING (EXISTS (SELECT 1 FROM public.ai_assistant_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "User inserts own messages" ON public.ai_assistant_messages
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.ai_assistant_conversations c WHERE c.id = conversation_id AND c.user_id = auth.uid()));
CREATE POLICY "Admins read all messages" ON public.ai_assistant_messages
  FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- 5. Trigger updated_at
CREATE TRIGGER trg_ds_shops_updated BEFORE UPDATE ON public.dropship_shops
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_dsp_updated BEFORE UPDATE ON public.dropship_shop_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_aiconv_updated BEFORE UPDATE ON public.ai_assistant_conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
