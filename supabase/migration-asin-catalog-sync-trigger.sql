-- Phase 1.1: Catalog-Sync bei Produkt-Änderung
-- Hält catalog.amazon_standard_identification_numbers mit products in Sync.
-- Die Spalten asin/parent_asin/variation_theme werden auch in migration-asin-product-attributes
-- und migration-asin-parent-child angelegt; hier als Fallback (IF NOT EXISTS) für unabhängige Migrations-Reihenfolge.

ALTER TABLE products ADD COLUMN IF NOT EXISTS asin TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_asin VARCHAR(15);
ALTER TABLE products ADD COLUMN IF NOT EXISTS variation_theme VARCHAR(50);

CREATE OR REPLACE FUNCTION catalog.sync_product_to_asin_registry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, catalog
AS $$
DECLARE
  v_product_type VARCHAR(50);
BEGIN
  -- product_type_id aus Kategorie ableiten (z. B. bongs -> BONGS)
  v_product_type := UPPER(REPLACE(COALESCE(NEW.category, 'zubehoer'), '-', '_'));

  -- Parent-ASIN sicherstellen, wenn Kind-Variation (nur updaten falls bereits Parent)
  IF NEW.parent_asin IS NOT NULL AND TRIM(NEW.parent_asin) <> '' THEN
    INSERT INTO catalog.amazon_standard_identification_numbers (asin, product_type_id, is_parent, parent_asin, variation_theme, product_id)
    VALUES (TRIM(NEW.parent_asin), v_product_type, TRUE, NULL, NULL, NULL)
    ON CONFLICT (asin) DO UPDATE SET
      product_type_id = EXCLUDED.product_type_id,
      updated_at = NOW()
    WHERE catalog.amazon_standard_identification_numbers.is_parent = TRUE;
  END IF;

  -- Kind-ASIN: Produkt hat eigenes ASIN
  IF NEW.asin IS NOT NULL AND NEW.asin <> '' THEN
    INSERT INTO catalog.amazon_standard_identification_numbers (asin, product_type_id, is_parent, parent_asin, variation_theme, product_id)
    VALUES (
      NEW.asin,
      v_product_type,
      FALSE,
      NULLIF(TRIM(NEW.parent_asin), ''),
      NULLIF(TRIM(NEW.variation_theme), ''),
      NEW.id
    )
    ON CONFLICT (asin) DO UPDATE SET
      product_type_id = EXCLUDED.product_type_id,
      parent_asin = EXCLUDED.parent_asin,
      variation_theme = EXCLUDED.variation_theme,
      product_id = NEW.id,
      updated_at = NOW();
  END IF;

  -- Aufräumen: Produkt ohne ASIN → ggf. aus Registry entfernen (anderes Produkt könnte ASIN übernommen haben)
  IF (TG_OP = 'UPDATE' AND OLD.asin IS NOT NULL AND (NEW.asin IS NULL OR NEW.asin <> OLD.asin)) THEN
    DELETE FROM catalog.amazon_standard_identification_numbers
    WHERE product_id = OLD.id AND asin = OLD.asin;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_product_to_asin_registry ON products;
CREATE TRIGGER trg_sync_product_to_asin_registry
  AFTER INSERT OR UPDATE OF asin, parent_asin, variation_theme, category
  ON products
  FOR EACH ROW
  EXECUTE FUNCTION catalog.sync_product_to_asin_registry();
