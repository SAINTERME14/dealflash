-- Validation côté serveur des attributs "Petites annonces"
-- Vérifie format des champs (année, kilométrage, VIN, dates, budget, enums)

CREATE OR REPLACE FUNCTION public.validate_petites_annonces_attributes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  v_parent_slug TEXT;
  v_sub_slug TEXT;
  v_attr JSONB;
  v_year INT;
  v_mileage INT;
  v_budget NUMERIC;
  v_current_year INT := EXTRACT(YEAR FROM now())::INT;
BEGIN
  -- Récupérer le slug de la catégorie parente
  SELECT slug INTO v_parent_slug
  FROM public.categories
  WHERE id = NEW.category_id;

  -- Si ce n'est pas "Petites annonces", on ne valide pas
  IF v_parent_slug IS DISTINCT FROM 'petites-annonces' THEN
    RETURN NEW;
  END IF;

  -- Sous-catégorie obligatoire pour Petites annonces
  IF NEW.subcategory_id IS NULL THEN
    RAISE EXCEPTION 'Sous-catégorie obligatoire pour Petites annonces';
  END IF;

  SELECT slug INTO v_sub_slug
  FROM public.categories
  WHERE id = NEW.subcategory_id AND parent_id = NEW.category_id;

  IF v_sub_slug IS NULL THEN
    RAISE EXCEPTION 'Sous-catégorie invalide';
  END IF;

  v_attr := COALESCE(NEW.attributes, '{}'::jsonb);

  -- ===== Autos d'occasion =====
  IF v_sub_slug = 'autos-occasion' THEN
    IF NOT (v_attr ? 'year' AND v_attr ? 'mileage_km') THEN
      RAISE EXCEPTION 'Année et kilométrage obligatoires pour autos';
    END IF;

    BEGIN
      v_year := (v_attr->>'year')::INT;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Année invalide (doit être un entier)';
    END;
    IF v_year < 1900 OR v_year > v_current_year + 1 THEN
      RAISE EXCEPTION 'Année hors plage (1900 - %)', v_current_year + 1;
    END IF;

    BEGIN
      v_mileage := (v_attr->>'mileage_km')::INT;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Kilométrage invalide (doit être un entier)';
    END;
    IF v_mileage < 0 OR v_mileage > 2000000 THEN
      RAISE EXCEPTION 'Kilométrage hors plage (0 - 2 000 000)';
    END IF;

    IF v_attr ? 'transmission' AND v_attr->>'transmission' <> ''
       AND v_attr->>'transmission' NOT IN ('manual', 'automatic') THEN
      RAISE EXCEPTION 'Transmission invalide';
    END IF;

    IF v_attr ? 'fuel' AND v_attr->>'fuel' <> ''
       AND v_attr->>'fuel' NOT IN ('gasoline', 'diesel', 'hybrid', 'electric') THEN
      RAISE EXCEPTION 'Carburant invalide';
    END IF;

    -- VIN: 17 caractères alphanumériques sans I, O, Q
    IF v_attr ? 'vin' AND v_attr->>'vin' <> '' THEN
      IF NOT (v_attr->>'vin' ~ '^[A-HJ-NPR-Z0-9]{17}$') THEN
        RAISE EXCEPTION 'VIN invalide (17 caractères, sans I/O/Q)';
      END IF;
    END IF;

  -- ===== Colocation =====
  ELSIF v_sub_slug = 'colocation-pa' THEN
    IF NOT (v_attr ? 'budget_max' AND v_attr ? 'room_type') THEN
      RAISE EXCEPTION 'Budget et type de chambre obligatoires';
    END IF;

    BEGIN
      v_budget := (v_attr->>'budget_max')::NUMERIC;
    EXCEPTION WHEN OTHERS THEN
      RAISE EXCEPTION 'Budget invalide';
    END;
    IF v_budget <= 0 OR v_budget > 10000 THEN
      RAISE EXCEPTION 'Budget hors plage (1 - 10 000)';
    END IF;

    IF v_attr->>'room_type' NOT IN ('private', 'shared', 'studio') THEN
      RAISE EXCEPTION 'Type de chambre invalide';
    END IF;

    IF v_attr ? 'available_from' AND v_attr->>'available_from' <> '' THEN
      IF NOT (v_attr->>'available_from' ~ '^\d{4}-\d{2}-\d{2}$') THEN
        RAISE EXCEPTION 'Date de disponibilité invalide (AAAA-MM-JJ)';
      END IF;
      BEGIN
        PERFORM (v_attr->>'available_from')::DATE;
      EXCEPTION WHEN OTHERS THEN
        RAISE EXCEPTION 'Date de disponibilité invalide';
      END;
    END IF;

    IF v_attr ? 'furnished' AND v_attr->>'furnished' <> ''
       AND v_attr->>'furnished' NOT IN ('yes', 'no', 'partial') THEN
      RAISE EXCEPTION 'Valeur "meublé" invalide';
    END IF;

  -- ===== Objets divers =====
  ELSIF v_sub_slug = 'objets-divers' THEN
    IF NOT (v_attr ? 'condition') THEN
      RAISE EXCEPTION 'État obligatoire pour objets divers';
    END IF;
    IF v_attr->>'condition' NOT IN ('new', 'like_new', 'good', 'fair', 'for_parts') THEN
      RAISE EXCEPTION 'État invalide';
    END IF;
    IF v_attr ? 'brand' AND length(v_attr->>'brand') > 80 THEN
      RAISE EXCEPTION 'Marque trop longue (max 80)';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_pa_attributes_insert ON public.listings;
CREATE TRIGGER validate_pa_attributes_insert
BEFORE INSERT ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.validate_petites_annonces_attributes();

DROP TRIGGER IF EXISTS validate_pa_attributes_update ON public.listings;
CREATE TRIGGER validate_pa_attributes_update
BEFORE UPDATE OF category_id, subcategory_id, attributes ON public.listings
FOR EACH ROW
EXECUTE FUNCTION public.validate_petites_annonces_attributes();