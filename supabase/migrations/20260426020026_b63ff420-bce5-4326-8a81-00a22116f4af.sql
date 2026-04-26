-- ============ ENUMS ============
CREATE TYPE public.supplier_type AS ENUM ('cj_dropshipping', 'aliexpress', 'alibaba', 'generic_api', 'csv_import', 'manual');
CREATE TYPE public.supplier_status AS ENUM ('active', 'paused', 'disabled');
CREATE TYPE public.dealflash_product_status AS ENUM ('draft', 'listed', 'paused', 'archived');
CREATE TYPE public.sales_channel_type AS ENUM ('amazon', 'temu', 'ebay', 'walmart', 'shopify', 'custom');
CREATE TYPE public.channel_listing_status AS ENUM ('draft', 'pending', 'published', 'error', 'removed');
CREATE TYPE public.dropship_order_status AS ENUM ('pending', 'ordered', 'shipped', 'delivered', 'cancelled', 'refunded');

-- ============ SUPPLIERS ============
CREATE TABLE public.suppliers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.supplier_type NOT NULL DEFAULT 'manual',
  status public.supplier_status NOT NULL DEFAULT 'active',
  api_endpoint TEXT,
  api_key_secret_name TEXT,
  contact_email TEXT,
  contact_url TEXT,
  default_lead_time_days INT DEFAULT 7,
  notes TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage suppliers" ON public.suppliers FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SUPPLIER PRODUCTS ============
CREATE TABLE public.supplier_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  external_sku TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  wholesale_price NUMERIC(12,2) NOT NULL CHECK (wholesale_price >= 0),
  currency TEXT NOT NULL DEFAULT 'CAD',
  stock_quantity INT,
  images TEXT[] NOT NULL DEFAULT '{}',
  source_url TEXT,
  raw_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (supplier_id, external_sku)
);
ALTER TABLE public.supplier_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage supplier products" ON public.supplier_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_supplier_products_supplier ON public.supplier_products(supplier_id);
CREATE TRIGGER update_supplier_products_updated_at BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DEALFLASH PRODUCTS ============
CREATE TABLE public.dealflash_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_product_id UUID REFERENCES public.supplier_products(id) ON DELETE SET NULL,
  listing_id UUID REFERENCES public.listings(id) ON DELETE SET NULL,
  internal_sku TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  cost_price NUMERIC(12,2) NOT NULL CHECK (cost_price >= 0),
  margin_percent NUMERIC(6,2) NOT NULL DEFAULT 30 CHECK (margin_percent >= 0),
  selling_price NUMERIC(12,2) NOT NULL CHECK (selling_price >= 0),
  currency TEXT NOT NULL DEFAULT 'CAD',
  stock_quantity INT,
  images TEXT[] NOT NULL DEFAULT '{}',
  status public.dealflash_product_status NOT NULL DEFAULT 'draft',
  internal_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dealflash_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage dealflash products" ON public.dealflash_products FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_dealflash_products_listing ON public.dealflash_products(listing_id);
CREATE INDEX idx_dealflash_products_status ON public.dealflash_products(status);
CREATE TRIGGER update_dealflash_products_updated_at BEFORE UPDATE ON public.dealflash_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ SALES CHANNELS ============
CREATE TABLE public.sales_channels (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type public.sales_channel_type NOT NULL,
  status public.supplier_status NOT NULL DEFAULT 'active',
  api_endpoint TEXT,
  api_key_secret_name TEXT,
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sales_channels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage sales channels" ON public.sales_channels FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sales_channels_updated_at BEFORE UPDATE ON public.sales_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ CHANNEL LISTINGS ============
CREATE TABLE public.channel_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealflash_product_id UUID NOT NULL REFERENCES public.dealflash_products(id) ON DELETE CASCADE,
  channel_id UUID NOT NULL REFERENCES public.sales_channels(id) ON DELETE CASCADE,
  external_id TEXT,
  external_url TEXT,
  status public.channel_listing_status NOT NULL DEFAULT 'draft',
  last_synced_at TIMESTAMPTZ,
  last_error TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (dealflash_product_id, channel_id)
);
ALTER TABLE public.channel_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage channel listings" ON public.channel_listings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_channel_listings_product ON public.channel_listings(dealflash_product_id);
CREATE INDEX idx_channel_listings_channel ON public.channel_listings(channel_id);
CREATE TRIGGER update_channel_listings_updated_at BEFORE UPDATE ON public.channel_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ DROPSHIP ORDERS ============
CREATE TABLE public.dropship_orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dealflash_product_id UUID NOT NULL REFERENCES public.dealflash_products(id) ON DELETE RESTRICT,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE RESTRICT,
  ticket_id UUID REFERENCES public.tickets(id) ON DELETE SET NULL,
  channel_id UUID REFERENCES public.sales_channels(id) ON DELETE SET NULL,
  external_order_id TEXT,
  status public.dropship_order_status NOT NULL DEFAULT 'pending',
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  cost_amount NUMERIC(12,2) NOT NULL CHECK (cost_amount >= 0),
  currency TEXT NOT NULL DEFAULT 'CAD',
  tracking_number TEXT,
  tracking_url TEXT,
  shipping_address JSONB,
  notes TEXT,
  ordered_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dropship_orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage dropship orders" ON public.dropship_orders FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_dropship_orders_status ON public.dropship_orders(status);
CREATE INDEX idx_dropship_orders_ticket ON public.dropship_orders(ticket_id);
CREATE TRIGGER update_dropship_orders_updated_at BEFORE UPDATE ON public.dropship_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();