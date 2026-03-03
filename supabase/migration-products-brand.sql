-- Marke/Hersteller für Produkte (z. B. Purize, RAW) – Anzeige und Filter im Shop
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS brand TEXT;

COMMENT ON COLUMN products.brand IS 'Marke/Hersteller (z. B. Purize, RAW) – optional, für Filter und Anzeige.';

CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand) WHERE brand IS NOT NULL;
