-- Lieferanten-Artikel: pro Lieferant Artikel einzeln pflegen und mit Shop-Produkt + API/Bestell-URL verknüpfen
CREATE TABLE IF NOT EXISTS supplier_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  supplier_sku TEXT NOT NULL,
  supplier_product_name TEXT,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  api_product_id TEXT,
  order_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(supplier_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_products_supplier ON supplier_products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_products_product ON supplier_products(product_id);

COMMENT ON TABLE supplier_products IS 'Lieferanten-Artikel: SKU/Name beim Lieferanten, Verknüpfung zum Shop-Produkt, API-ID und Bestell-URL';
COMMENT ON COLUMN supplier_products.supplier_sku IS 'Artikelnummer/SKU beim Lieferanten (für API/E-Mail-Bestellung)';
COMMENT ON COLUMN supplier_products.supplier_product_name IS 'Bezeichnung beim Lieferanten';
COMMENT ON COLUMN supplier_products.product_id IS 'Verknüpftes Shop-Produkt (optional)';
COMMENT ON COLUMN supplier_products.api_product_id IS 'Produkt-ID in der Lieferanten-API (für automatische Bestellung)';
COMMENT ON COLUMN supplier_products.order_url IS 'Direktlink zur Bestellung beim Lieferanten (z. B. Katalog-URL)';
