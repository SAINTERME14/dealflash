
-- =========================================================================
-- RENFORCEMENT DROPSHIPPING : intégrité, performance, audit, automatisation
-- =========================================================================

-- 1. SKU unique pour dealflash_products
ALTER TABLE public.dealflash_products
  DROP CONSTRAINT IF EXISTS dealflash_products_internal_sku_unique;
ALTER TABLE public.dealflash_products
  ADD CONSTRAINT dealflash_products_internal_sku_unique UNIQUE (internal_sku);

-- 2. SKU externe unique par fournisseur
ALTER TABLE public.supplier_products
  DROP CONSTRAINT IF EXISTS supplier_products_supplier_sku_unique;
ALTER TABLE public.supplier_products
  ADD CONSTRAINT supplier_products_supplier_sku_unique UNIQUE (supplier_id, external_sku);

-- 3. Contraintes de validation prix/marge/stock
ALTER TABLE public.dealflash_products
  DROP CONSTRAINT IF EXISTS dealflash_products_prices_positive;
ALTER TABLE public.dealflash_products
  ADD CONSTRAINT dealflash_products_prices_positive
  CHECK (cost_price >= 0 AND selling_price >= 0 AND margin_percent >= 0);

ALTER TABLE public.dealflash_products
  DROP CONSTRAINT IF EXISTS dealflash_products_stock_non_negative;
ALTER TABLE public.dealflash_products
  ADD CONSTRAINT dealflash_products_stock_non_negative
  CHECK (stock_quantity IS NULL OR stock_quantity >= 0);

ALTER TABLE public.supplier_products
  DROP CONSTRAINT IF EXISTS supplier_products_price_non_negative;
ALTER TABLE public.supplier_products
  ADD CONSTRAINT supplier_products_price_non_negative
  CHECK (wholesale_price >= 0);

ALTER TABLE public.dropship_orders
  DROP CONSTRAINT IF EXISTS dropship_orders_qty_positive;
ALTER TABLE public.dropship_orders
  ADD CONSTRAINT dropship_orders_qty_positive
  CHECK (quantity > 0 AND cost_amount >= 0);

-- 4. Empêcher la suppression d'un fournisseur ayant des commandes actives
CREATE OR REPLACE FUNCTION public.guard_supplier_deletion()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM public.dropship_orders
    WHERE supplier_id = OLD.id
      AND status IN ('pending', 'ordered', 'shipped')
  ) THEN
    RAISE EXCEPTION 'Impossible de supprimer ce fournisseur : commandes en cours';
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS guard_supplier_deletion_trg ON public.suppliers;
CREATE TRIGGER guard_supplier_deletion_trg
  BEFORE DELETE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.guard_supplier_deletion();

-- 5. Auto-update timestamps
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON public.suppliers;
CREATE TRIGGER update_suppliers_updated_at
  BEFORE UPDATE ON public.suppliers
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_supplier_products_updated_at ON public.supplier_products;
CREATE TRIGGER update_supplier_products_updated_at
  BEFORE UPDATE ON public.supplier_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dealflash_products_updated_at ON public.dealflash_products;
CREATE TRIGGER update_dealflash_products_updated_at
  BEFORE UPDATE ON public.dealflash_products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_sales_channels_updated_at ON public.sales_channels;
CREATE TRIGGER update_sales_channels_updated_at
  BEFORE UPDATE ON public.sales_channels
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_channel_listings_updated_at ON public.channel_listings;
CREATE TRIGGER update_channel_listings_updated_at
  BEFORE UPDATE ON public.channel_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_dropship_orders_updated_at ON public.dropship_orders;
CREATE TRIGGER update_dropship_orders_updated_at
  BEFORE UPDATE ON public.dropship_orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. Trigger : auto-set ordered_at / shipped_at / delivered_at
CREATE OR REPLACE FUNCTION public.dropship_order_status_timestamps()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'ordered' AND OLD.status <> 'ordered' AND NEW.ordered_at IS NULL THEN
    NEW.ordered_at := now();
  END IF;
  IF NEW.status = 'shipped' AND OLD.status <> 'shipped' AND NEW.shipped_at IS NULL THEN
    NEW.shipped_at := now();
  END IF;
  IF NEW.status = 'delivered' AND OLD.status <> 'delivered' AND NEW.delivered_at IS NULL THEN
    NEW.delivered_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dropship_order_status_timestamps_trg ON public.dropship_orders;
CREATE TRIGGER dropship_order_status_timestamps_trg
  BEFORE UPDATE ON public.dropship_orders
  FOR EACH ROW EXECUTE FUNCTION public.dropship_order_status_timestamps();

-- 7. Index de performance
CREATE INDEX IF NOT EXISTS idx_dealflash_products_status ON public.dealflash_products(status);
CREATE INDEX IF NOT EXISTS idx_dealflash_products_supplier ON public.dealflash_products(supplier_product_id);
CREATE INDEX IF NOT EXISTS idx_dealflash_products_listing ON public.dealflash_products(listing_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON public.supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_synced ON public.supplier_products(last_synced_at);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_status ON public.dropship_orders(status);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_supplier ON public.dropship_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_product ON public.dropship_orders(dealflash_product_id);
CREATE INDEX IF NOT EXISTS idx_dropship_orders_ticket ON public.dropship_orders(ticket_id);
CREATE INDEX IF NOT EXISTS idx_channel_listings_channel ON public.channel_listings(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_listings_product ON public.channel_listings(dealflash_product_id);
CREATE INDEX IF NOT EXISTS idx_channel_listings_status ON public.channel_listings(status);

-- 8. Audit log dropshipping
CREATE TABLE IF NOT EXISTS public.dropship_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  old_data JSONB,
  new_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.dropship_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins view dropship audit" ON public.dropship_audit_log;
CREATE POLICY "Admins view dropship audit"
  ON public.dropship_audit_log FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_dropship_audit_entity ON public.dropship_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_dropship_audit_created ON public.dropship_audit_log(created_at DESC);

-- Fonction d'audit pour produits DealFlash
CREATE OR REPLACE FUNCTION public.log_dealflash_product_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dropship_audit_log (actor_id, entity_type, entity_id, action, new_data)
    VALUES (auth.uid(), 'dealflash_product', NEW.id, 'created',
            jsonb_build_object('sku', NEW.internal_sku, 'title', NEW.title, 'status', NEW.status, 'selling_price', NEW.selling_price));
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.selling_price IS DISTINCT FROM OLD.selling_price
       OR NEW.cost_price IS DISTINCT FROM OLD.cost_price THEN
      INSERT INTO public.dropship_audit_log (actor_id, entity_type, entity_id, action, old_data, new_data)
      VALUES (auth.uid(), 'dealflash_product', NEW.id, 'updated',
              jsonb_build_object('status', OLD.status, 'cost_price', OLD.cost_price, 'selling_price', OLD.selling_price),
              jsonb_build_object('status', NEW.status, 'cost_price', NEW.cost_price, 'selling_price', NEW.selling_price));
    END IF;
    RETURN NEW;
  END IF;
  IF TG_OP = 'DELETE' THEN
    INSERT INTO public.dropship_audit_log (actor_id, entity_type, entity_id, action, old_data)
    VALUES (auth.uid(), 'dealflash_product', OLD.id, 'deleted',
            jsonb_build_object('sku', OLD.internal_sku, 'title', OLD.title));
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS log_dealflash_product_change_trg ON public.dealflash_products;
CREATE TRIGGER log_dealflash_product_change_trg
  AFTER INSERT OR UPDATE OR DELETE ON public.dealflash_products
  FOR EACH ROW EXECUTE FUNCTION public.log_dealflash_product_change();

-- Fonction d'audit pour commandes dropship
CREATE OR REPLACE FUNCTION public.log_dropship_order_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.dropship_audit_log (actor_id, entity_type, entity_id, action, new_data)
    VALUES (auth.uid(), 'dropship_order', NEW.id, 'created',
            jsonb_build_object('status', NEW.status, 'cost_amount', NEW.cost_amount, 'quantity', NEW.quantity));
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.dropship_audit_log (actor_id, entity_type, entity_id, action, old_data, new_data)
    VALUES (auth.uid(), 'dropship_order', NEW.id, 'status_changed',
            jsonb_build_object('status', OLD.status),
            jsonb_build_object('status', NEW.status, 'tracking', NEW.tracking_number));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS log_dropship_order_change_trg ON public.dropship_orders;
CREATE TRIGGER log_dropship_order_change_trg
  AFTER INSERT OR UPDATE ON public.dropship_orders
  FOR EACH ROW EXECUTE FUNCTION public.log_dropship_order_change();

-- 9. Fonction utilitaire : créer/synchroniser un listing public depuis un produit DealFlash
CREATE OR REPLACE FUNCTION public.sync_dealflash_to_listing()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_admin_id UUID;
  v_category_id UUID;
  v_listing_id UUID;
BEGIN
  -- Seulement quand le produit passe à "listed"
  IF NEW.status <> 'listed' THEN
    -- Si dépublié, mettre listing en pause
    IF NEW.listing_id IS NOT NULL AND OLD IS NOT NULL AND OLD.status = 'listed' THEN
      UPDATE public.listings SET status = 'paused', updated_at = now()
      WHERE id = NEW.listing_id;
    END IF;
    RETURN NEW;
  END IF;

  -- Trouver un admin pour être le seller_id officiel DealFlash
  SELECT user_id INTO v_admin_id
  FROM public.user_roles WHERE role = 'admin' LIMIT 1;

  IF v_admin_id IS NULL THEN
    RAISE NOTICE 'Aucun admin trouvé pour publier le produit DealFlash';
    RETURN NEW;
  END IF;

  -- Catégorie par défaut "Produits DealFlash" (créée si absente)
  SELECT id INTO v_category_id FROM public.categories WHERE slug = 'dealflash-officiel' LIMIT 1;
  IF v_category_id IS NULL THEN
    INSERT INTO public.categories (name, slug, listing_type, is_active, display_order, description)
    VALUES ('Produits DealFlash', 'dealflash-officiel', 'product', true, 0, 'Produits vendus officiellement par DealFlash')
    RETURNING id INTO v_category_id;
  END IF;

  IF NEW.listing_id IS NULL THEN
    INSERT INTO public.listings (
      seller_id, category_id, title, description, price, currency,
      images, status, listing_type
    ) VALUES (
      v_admin_id, v_category_id, NEW.title,
      COALESCE(NEW.description, NEW.title),
      NEW.selling_price, NEW.currency,
      NEW.images, 'active', 'product'
    ) RETURNING id INTO v_listing_id;

    NEW.listing_id := v_listing_id;
  ELSE
    UPDATE public.listings SET
      title = NEW.title,
      description = COALESCE(NEW.description, NEW.title),
      price = NEW.selling_price,
      images = NEW.images,
      status = 'active',
      updated_at = now()
    WHERE id = NEW.listing_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_dealflash_to_listing_trg ON public.dealflash_products;
CREATE TRIGGER sync_dealflash_to_listing_trg
  BEFORE INSERT OR UPDATE OF status, title, description, selling_price, images
  ON public.dealflash_products
  FOR EACH ROW EXECUTE FUNCTION public.sync_dealflash_to_listing();
