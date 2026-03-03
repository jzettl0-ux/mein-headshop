-- ============================================
-- Phase 1.1: Parent/Child ASIN (Blueprint 2.1, 2.3)
-- ============================================
-- ASIN-Hierarchie: Parent (nicht kaufbar) gruppiert Child-ASINs (Variationen).
-- Variation Theme: Size, Color, PackQuantity etc.

CREATE SCHEMA IF NOT EXISTS catalog;

-- Globale ASIN-Registrierung und Parent/Child-Mapping (Blueprint 2.3)
CREATE TABLE IF NOT EXISTS catalog.amazon_standard_identification_numbers (
  asin VARCHAR(15) PRIMARY KEY CHECK (length(asin) >= 8 AND length(asin) <= 15 AND asin ~ '^[A-Z0-9]+$'),
  product_type_id VARCHAR(50) NOT NULL,           -- z.B. 'BONG', 'VAPORIZER', 'SEEDS'
  is_parent BOOLEAN NOT NULL DEFAULT FALSE,
  parent_asin VARCHAR(15) REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE SET NULL,
  variation_theme VARCHAR(50),                    -- z.B. 'Size', 'Color', 'PackQuantity' (nur bei Child)
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,  -- Verknüpfung zu unserem Produkt (nur Child)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT chk_parent_logic CHECK (
    (is_parent = TRUE AND parent_asin IS NULL AND product_id IS NULL) OR
    (is_parent = FALSE)
  ),
  CONSTRAINT chk_variation_theme CHECK (
    (is_parent = TRUE AND variation_theme IS NULL) OR
    (is_parent = FALSE)
  )
);

COMMENT ON TABLE catalog.amazon_standard_identification_numbers IS 'ASIN-Registry: Parent gruppiert Childs. Childs sind kaufbare Produkte.';
COMMENT ON COLUMN catalog.amazon_standard_identification_numbers.product_type_id IS 'Produkttyp für JSON-Schema-Validierung (Product Type Definitions)';
COMMENT ON COLUMN catalog.amazon_standard_identification_numbers.variation_theme IS 'Erlaubte Variationsachse: Size, Color, SizeColor, PackQuantity';

CREATE INDEX IF NOT EXISTS idx_catalog_asin_parent ON catalog.amazon_standard_identification_numbers(parent_asin);
CREATE INDEX IF NOT EXISTS idx_catalog_asin_product ON catalog.amazon_standard_identification_numbers(product_id) WHERE product_id IS NOT NULL;

-- Trigger für updated_at
CREATE TRIGGER update_catalog_asin_updated_at
  BEFORE UPDATE ON catalog.amazon_standard_identification_numbers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- products: Parent-ASIN und Variation Theme ergänzen
ALTER TABLE products ADD COLUMN IF NOT EXISTS parent_asin VARCHAR(15);
ALTER TABLE products ADD COLUMN IF NOT EXISTS variation_theme VARCHAR(50);

COMMENT ON COLUMN products.parent_asin IS 'Parent-ASIN, falls dieses Produkt eine Variation ist';
COMMENT ON COLUMN products.variation_theme IS 'Variationsachse: Size, Color, PackQuantity (nur bei Variationen)';

-- FK zu catalog (optional, nur wenn parent_asin gesetzt und in Registry existiert)
-- Wir verzichten auf FK, damit bestehende Daten nicht brechen; App-Layer hält Konsistenz

-- RLS
ALTER TABLE catalog.amazon_standard_identification_numbers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "catalog_asin_read_public"
  ON catalog.amazon_standard_identification_numbers FOR SELECT
  USING (true);
