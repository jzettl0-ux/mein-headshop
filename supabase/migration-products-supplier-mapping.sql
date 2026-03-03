-- Produkt-Mapping: Lieferanten-SKU und -Produktname für One-Click-Order
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_sku TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_product_name TEXT;

COMMENT ON COLUMN products.supplier_sku IS 'Artikelnummer/SKU beim Lieferanten (für API/E-Mail-Bestellung)';
COMMENT ON COLUMN products.supplier_product_name IS 'Bezeichnung beim Lieferanten (für Bestelltext)';
