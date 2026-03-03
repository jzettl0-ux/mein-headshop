-- Phase 1.1: Backfill – bestehende Produkte in catalog.amazon_standard_identification_numbers übernehmen
-- Führt den Sync für alle Produkte aus, die asin oder parent_asin haben.
-- Voraussetzung: migration-asin-parent-child.sql, migration-asin-catalog-sync-trigger.sql

DO $$
DECLARE
  rec RECORD;
  v_product_type VARCHAR(50);
BEGIN
  FOR rec IN
    SELECT id, asin, parent_asin, variation_theme, category
    FROM products
    WHERE (asin IS NOT NULL AND TRIM(asin) <> '') OR (parent_asin IS NOT NULL AND TRIM(parent_asin) <> '')
  LOOP
    v_product_type := UPPER(REPLACE(COALESCE(rec.category, 'zubehoer'), '-', '_'));

    -- Parent-ASIN sicherstellen
    IF rec.parent_asin IS NOT NULL AND TRIM(rec.parent_asin) <> '' THEN
      INSERT INTO catalog.amazon_standard_identification_numbers (asin, product_type_id, is_parent, parent_asin, variation_theme, product_id)
      VALUES (TRIM(rec.parent_asin), v_product_type, TRUE, NULL, NULL, NULL)
      ON CONFLICT (asin) DO UPDATE SET
        product_type_id = EXCLUDED.product_type_id,
        updated_at = NOW()
      WHERE catalog.amazon_standard_identification_numbers.is_parent = TRUE;
    END IF;

    -- Child-ASIN
    IF rec.asin IS NOT NULL AND rec.asin <> '' THEN
      INSERT INTO catalog.amazon_standard_identification_numbers (asin, product_type_id, is_parent, parent_asin, variation_theme, product_id)
      VALUES (
        rec.asin,
        v_product_type,
        FALSE,
        NULLIF(TRIM(rec.parent_asin), ''),
        NULLIF(TRIM(rec.variation_theme), ''),
        rec.id
      )
      ON CONFLICT (asin) DO UPDATE SET
        product_type_id = EXCLUDED.product_type_id,
        parent_asin = EXCLUDED.parent_asin,
        variation_theme = EXCLUDED.variation_theme,
        product_id = rec.id,
        updated_at = NOW();
    END IF;
  END LOOP;
END;
$$;

COMMENT ON COLUMN catalog.amazon_standard_identification_numbers.product_id IS 'Verknüpfung zu products.id (nur bei Child-ASIN)';
