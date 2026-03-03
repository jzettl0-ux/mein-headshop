-- ============================================
-- Phase 3: ASIN-Modell – Erweiterung (rückwärtskompatibel)
-- ============================================
-- products.asin: optionale 10-stellige ASIN (Amazon Standard Identification Number)
-- catalog.product_attributes: flexible EAV-Attribute für Produkte

-- products.asin hinzufügen (optional, unique)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS asin TEXT;

-- ASIN: 10 Zeichen alphanumerisch (B0XXXXXXXX, etc.)
-- CHECK wäre zu strikt für reine Zahlen-ASINs; wir erlauben 8-10 Zeichen
ALTER TABLE products
  DROP CONSTRAINT IF EXISTS products_asin_format;

ALTER TABLE products
  ADD CONSTRAINT products_asin_format
  CHECK (asin IS NULL OR (length(asin) >= 8 AND length(asin) <= 15 AND asin ~ '^[A-Z0-9]+$'));

CREATE UNIQUE INDEX IF NOT EXISTS idx_products_asin ON products(asin) WHERE asin IS NOT NULL;

COMMENT ON COLUMN products.asin IS 'ASIN (8-15 Zeichen alphanumerisch), optional – für Katalog-Sync und Multi-Vendor';

-- catalog-Schema (falls nicht vorhanden)
CREATE SCHEMA IF NOT EXISTS catalog;

-- product_attributes: EAV für flexible Produktattribute (Farbe, Größe, etc.)
CREATE TABLE IF NOT EXISTS catalog.product_attributes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  attribute_key TEXT NOT NULL,
  attribute_value JSONB NOT NULL DEFAULT 'null',

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(product_id, attribute_key)
);

CREATE INDEX IF NOT EXISTS idx_catalog_product_attributes_product ON catalog.product_attributes(product_id);
CREATE INDEX IF NOT EXISTS idx_catalog_product_attributes_key ON catalog.product_attributes(attribute_key);
CREATE INDEX IF NOT EXISTS idx_catalog_product_attributes_value ON catalog.product_attributes USING gin(attribute_value);

COMMENT ON TABLE catalog.product_attributes IS 'Flexible Produktattribute (EAV) – z. B. color, size, pack_quantity für Variation Themes';

-- updated_at Trigger
CREATE TRIGGER update_catalog_product_attributes_updated_at
  BEFORE UPDATE ON catalog.product_attributes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE catalog.product_attributes ENABLE ROW LEVEL SECURITY;

-- Öffentlich lesbar (Attributdaten folgen Produktsichtbarkeit über App-Layer)
CREATE POLICY "product_attributes_read_public"
  ON catalog.product_attributes FOR SELECT
  USING (true);
