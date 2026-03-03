-- Hauptkategorien in eigener Tabelle (bearbeitbar im Admin)
CREATE TABLE IF NOT EXISTS product_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_categories_sort ON product_categories(sort_order);

-- Bestehende Kategorien einfügen
INSERT INTO product_categories (slug, name, sort_order) VALUES
  ('bongs', 'Bongs', 0),
  ('grinder', 'Grinder', 1),
  ('papers', 'Papers & Filter', 2),
  ('vaporizer', 'Vaporizer', 3),
  ('zubehoer', 'Zubehör', 4),
  ('influencer-drops', 'Influencer Drops', 5)
ON CONFLICT (slug) DO NOTHING;

-- CHECK-Constraint von products.category entfernen (falls vorhanden)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;

-- CHECK-Constraint von product_subcategories.parent_category entfernen (falls vorhanden)
ALTER TABLE product_subcategories DROP CONSTRAINT IF EXISTS product_subcategories_parent_category_check;

COMMENT ON TABLE product_categories IS 'Bearbeitbare Hauptkategorien für Produkte';

-- RLS: Öffentlich lesbar, Admin kann alles
ALTER TABLE product_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product categories are viewable by everyone"
  ON product_categories FOR SELECT USING (true);
