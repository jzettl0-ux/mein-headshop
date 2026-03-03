-- ============================================
-- Unterkategorien pro Produkt-Kategorie (z. B. Bongs → Glasbongs, Acryl Bongs)
-- ============================================

CREATE TABLE IF NOT EXISTS product_subcategories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_category TEXT NOT NULL CHECK (parent_category IN ('bongs', 'grinder', 'papers', 'vaporizer', 'zubehoer', 'influencer-drops')),
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_category, slug)
);

CREATE INDEX IF NOT EXISTS idx_product_subcategories_parent ON product_subcategories(parent_category);

-- Beispiel-Unterkategorien für Bongs
INSERT INTO product_subcategories (parent_category, slug, name, sort_order) VALUES
  ('bongs', 'glasbongs', 'Glasbongs', 0),
  ('bongs', 'acrylbongs', 'Acryl Bongs', 1),
  ('bongs', 'minibongs', 'Mini Bongs', 2),
  ('bongs', 'beaker', 'Beaker', 3),
  ('bongs', 'straight', 'Straight Tubes', 4)
ON CONFLICT (parent_category, slug) DO NOTHING;

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS subcategory_slug TEXT;

COMMENT ON COLUMN products.subcategory_slug IS 'Optional: Unterkategorie innerhalb der Hauptkategorie (muss in product_subcategories existieren)';
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(category, subcategory_slug);

-- RLS
ALTER TABLE product_subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Product subcategories are viewable by everyone"
  ON product_subcategories FOR SELECT USING (true);

CREATE POLICY "Admin can manage product subcategories"
  ON product_subcategories FOR ALL
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');
