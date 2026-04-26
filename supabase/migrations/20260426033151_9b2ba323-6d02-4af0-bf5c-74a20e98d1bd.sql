
-- Activer vault si pas déjà fait
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Stocker la service role key dans Vault (l'utilisateur devra la créer une seule fois)
-- On crée un placeholder qu'on remplira via l'API Vault
DO $$
DECLARE
  v_existing UUID;
BEGIN
  SELECT id INTO v_existing FROM vault.secrets WHERE name = 'service_role_key';
  IF v_existing IS NULL THEN
    PERFORM vault.create_secret('PLACEHOLDER_REPLACE_ME', 'service_role_key', 'Service role key utilisée par les triggers et crons');
  END IF;
END $$;

-- Modifier le trigger pour utiliser Vault
CREATE OR REPLACE FUNCTION public.trigger_cj_auto_place_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions, vault
AS $$
DECLARE
  v_supplier_type supplier_type;
  v_function_url TEXT;
  v_service_key TEXT;
BEGIN
  SELECT type INTO v_supplier_type FROM public.suppliers WHERE id = NEW.supplier_id;
  IF v_supplier_type <> 'cj_dropshipping' THEN
    RETURN NEW;
  END IF;

  SELECT value INTO v_function_url FROM public.edge_function_config WHERE key = 'project_url';
  SELECT decrypted_secret INTO v_service_key FROM vault.decrypted_secrets WHERE name = 'service_role_key';

  IF v_function_url IS NULL OR v_service_key IS NULL OR v_service_key = 'PLACEHOLDER_REPLACE_ME' THEN
    RAISE NOTICE 'Vault service_role_key non configuré : auto place order ignoré (commande %)', NEW.id;
    RETURN NEW;
  END IF;

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

-- Planifier le cron de sync tracking toutes les 6h
SELECT cron.unschedule('cj-sync-tracking-every-6h') WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'cj-sync-tracking-every-6h'
);

SELECT cron.schedule(
  'cj-sync-tracking-every-6h',
  '0 */6 * * *',
  $cron$
  SELECT net.http_post(
    url := (SELECT value FROM public.edge_function_config WHERE key = 'project_url') || '/functions/v1/cj-sync-tracking',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'service_role_key')
    ),
    body := '{}'::jsonb
  );
  $cron$
);
