
-- 1. Activer extensions nécessaires
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- 2. Stocker l'URL du projet et la service-role key dans des GUC accessibles via current_setting()
-- (déjà disponible via vault dans certains setups, on utilise une approche table-config)
CREATE TABLE IF NOT EXISTS public.edge_function_config (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.edge_function_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage edge config"
  ON public.edge_function_config
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Trigger : quand une dropship_order pending CJ est créée, appeler cj-place-order
CREATE OR REPLACE FUNCTION public.trigger_cj_auto_place_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_supplier_type supplier_type;
  v_function_url TEXT;
  v_service_key TEXT;
BEGIN
  -- Vérifier que c'est bien un fournisseur CJ
  SELECT type INTO v_supplier_type
  FROM public.suppliers
  WHERE id = NEW.supplier_id;

  IF v_supplier_type <> 'cj_dropshipping' THEN
    RETURN NEW;
  END IF;

  -- Récupérer config edge function
  SELECT value INTO v_function_url FROM public.edge_function_config WHERE key = 'project_url';
  SELECT value INTO v_service_key FROM public.edge_function_config WHERE key = 'service_role_key';

  IF v_function_url IS NULL OR v_service_key IS NULL THEN
    -- Pas configuré : on log mais on ne bloque pas l'insert
    RAISE NOTICE 'edge_function_config manquant : auto place order ignoré';
    RETURN NEW;
  END IF;

  -- Appel async via pg_net
  PERFORM net.http_post(
    url := v_function_url || '/functions/v1/cj-place-order',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object('dropship_order_id', NEW.id, 'auto', true)
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS dropship_orders_auto_cj ON public.dropship_orders;
CREATE TRIGGER dropship_orders_auto_cj
  AFTER INSERT ON public.dropship_orders
  FOR EACH ROW
  WHEN (NEW.status = 'pending')
  EXECUTE FUNCTION public.trigger_cj_auto_place_order();

-- 4. Auto-création d'une dropship_order quand un ticket est payé pour un produit DealFlash
CREATE OR REPLACE FUNCTION public.create_dropship_order_from_ticket()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_dealflash_product RECORD;
  v_supplier_id UUID;
BEGIN
  -- Seulement quand un ticket passe à "paid"
  IF NEW.status <> 'paid' OR (OLD IS NOT NULL AND OLD.status = 'paid') THEN
    RETURN NEW;
  END IF;

  -- Chercher le produit DealFlash lié à ce listing
  SELECT dp.id, dp.cost_price, dp.currency, sp.supplier_id
  INTO v_dealflash_product
  FROM public.dealflash_products dp
  LEFT JOIN public.supplier_products sp ON sp.id = dp.supplier_product_id
  WHERE dp.listing_id = NEW.listing_id
    AND dp.status = 'listed'
  LIMIT 1;

  -- Si pas un produit DealFlash dropship, on ne fait rien
  IF v_dealflash_product.id IS NULL OR v_dealflash_product.supplier_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Créer la dropship_order pending (le trigger CJ se déclenchera)
  INSERT INTO public.dropship_orders (
    dealflash_product_id,
    supplier_id,
    ticket_id,
    quantity,
    cost_amount,
    currency,
    status,
    shipping_address,
    notes
  ) VALUES (
    v_dealflash_product.id,
    v_dealflash_product.supplier_id,
    NEW.id,
    1,
    v_dealflash_product.cost_price,
    v_dealflash_product.currency,
    'pending',
    jsonb_build_object(
      'name', NEW.buyer_first_name || ' ' || NEW.buyer_last_name,
      'email', NEW.buyer_email,
      'phone', NEW.buyer_phone
    ),
    'Auto-créé depuis ticket ' || NEW.confirmation_code
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tickets_create_dropship_order ON public.tickets;
CREATE TRIGGER tickets_create_dropship_order
  AFTER INSERT OR UPDATE OF status ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.create_dropship_order_from_ticket();
