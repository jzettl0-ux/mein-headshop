-- ============================================
-- KOMPLETTES RESET & NEU-AUFBAU
-- Premium Headshop Datenbank
-- ============================================
-- Führe dieses Script aus, um ALLES neu aufzubauen
-- ACHTUNG: Löscht alle existierenden Daten!
-- ============================================

-- SCHRITT 1: Alles löschen
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS influencers CASCADE;

-- SCHRITT 2: Tabellen neu erstellen
-- ============================================
-- INFLUENCERS TABLE
-- ============================================
CREATE TABLE influencers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  banner_url TEXT,
  social_links JSONB DEFAULT '{}',
  accent_color TEXT DEFAULT '#D4AF37',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  images TEXT[] DEFAULT '{}',
  category TEXT NOT NULL CHECK (category IN ('bongs', 'grinder', 'papers', 'vaporizer', 'zubehoer', 'influencer-drops')),
  stock INTEGER DEFAULT 0,
  is_adult_only BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number TEXT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  customer_email TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  shipping_address JSONB NOT NULL,
  billing_address JSONB NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  shipping_cost DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  has_adult_items BOOLEAN DEFAULT false,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  product_image TEXT,
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_influencer ON products(influencer_id);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_adult ON products(is_adult_only);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_email);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_influencers_updated_at
  BEFORE UPDATE ON influencers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS AKTIVIEREN
-- ============================================
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PRODUCTS
-- ============================================
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage products"
  ON products FOR ALL
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');

-- ============================================
-- RLS POLICIES - INFLUENCERS
-- ============================================
CREATE POLICY "Influencers are viewable by everyone"
  ON influencers FOR SELECT
  USING (true);

CREATE POLICY "Admin can manage influencers"
  ON influencers FOR ALL
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');

-- ============================================
-- RLS POLICIES - ORDERS
-- ============================================
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');

-- ============================================
-- RLS POLICIES - ORDER_ITEMS
-- ============================================
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all order items"
  ON order_items FOR SELECT
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');

CREATE POLICY "Anyone can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- ============================================
-- STORAGE BUCKETS
-- ============================================
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('influencer-images', 'influencer-images', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- SEED DATA - INFLUENCER
-- ============================================
INSERT INTO influencers (name, slug, bio, avatar_url, banner_url, social_links, accent_color, is_active) VALUES
(
  'Max Grün',
  'max-gruen',
  'Premium Cannabis Content Creator mit Fokus auf High-End Produkte',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&h=400&fit=crop&q=80',
  '{"instagram": "https://instagram.com/maxgruen"}',
  '#39FF14',
  true
),
(
  'Lisa High',
  'lisa-high',
  'High-End Lifestyle & Cannabis Expertin',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&h=400&fit=crop&q=80',
  '{"instagram": "https://instagram.com/lisahigh"}',
  '#D4AF37',
  true
),
(
  'Tom Smoke',
  'tom-smoke',
  'Vaporizer Spezialist & Tech-Enthusiast',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&q=80',
  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=1200&h=400&fit=crop&q=80',
  '{"instagram": "https://instagram.com/tomsmoke"}',
  '#FF6B35',
  true
);

-- Hole Influencer-IDs
DO $$
DECLARE
  max_id UUID;
  lisa_id UUID;
  tom_id UUID;
BEGIN
  SELECT id INTO max_id FROM influencers WHERE slug = 'max-gruen';
  SELECT id INTO lisa_id FROM influencers WHERE slug = 'lisa-high';
  SELECT id INTO tom_id FROM influencers WHERE slug = 'tom-smoke';

  -- ============================================
  -- SEED DATA - PRODUCTS
  -- ============================================
  INSERT INTO products (name, slug, description, price, image_url, images, category, stock, is_adult_only, is_featured, influencer_id, tags) VALUES
  -- Store Produkte
  (
    'Premium Glasbong "Crystal"',
    'premium-glasbong-crystal',
    'Handgefertigte Premium-Bong aus hochwertigem Borosilikatglas',
    89.99,
    'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&q=80'],
    'bongs',
    12,
    true,
    true,
    NULL,
    ARRAY['premium', 'glas']
  ),
  (
    'XXL Grinder Gold Edition',
    'xxl-grinder-gold',
    'CNC-gefrästes Aluminium Grinder mit Kief-Fänger',
    34.99,
    'https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80'],
    'grinder',
    28,
    false,
    true,
    NULL,
    ARRAY['grinder', 'gold']
  ),
  (
    'RAW Black King Size Papers',
    'raw-black-king-size',
    'Ultradünne ungebleichte Papers',
    4.99,
    'https://images.unsplash.com/photo-1606506082871-8e1c9c3a9e5a?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1606506082871-8e1c9c3a9e5a?w=800&q=80'],
    'papers',
    150,
    false,
    false,
    NULL,
    ARRAY['papers', 'raw']
  ),
  (
    'Mighty+ Vaporizer',
    'mighty-plus-vaporizer',
    'Top Vaporizer von Storz & Bickel',
    349.99,
    'https://images.unsplash.com/photo-1581922814484-e2bcd2508e31?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1581922814484-e2bcd2508e31?w=800&q=80'],
    'vaporizer',
    8,
    true,
    true,
    NULL,
    ARRAY['vaporizer', 'premium']
  ),
  -- Influencer Produkte
  (
    'Max''s Choice - Perkolator Bong',
    'max-choice-perkolator-bong',
    'Max Grün''s persönliche Lieblingsbong mit Triple Perkolator',
    129.99,
    'https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1577705998148-6da4f3d70118?w=800&q=80'],
    'influencer-drops',
    5,
    true,
    true,
    max_id,
    ARRAY['influencer', 'max-gruen', 'bong']
  ),
  (
    'Max Grün Signature Grinder',
    'max-gruen-signature-grinder',
    'Custom Grinder mit Max Grün Logo',
    44.99,
    'https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1628024488892-3b7c86a4907c?w=800&q=80'],
    'influencer-drops',
    15,
    false,
    true,
    max_id,
    ARRAY['influencer', 'max-gruen']
  ),
  (
    'Lisa''s Gold Bong Deluxe',
    'lisa-gold-bong-deluxe',
    'Lisa High''s luxuriöse Bong mit Kristallen',
    199.99,
    'https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1582735689369-4fe89db7114c?w=800&q=80'],
    'influencer-drops',
    3,
    true,
    true,
    lisa_id,
    ARRAY['influencer', 'lisa-high', 'luxury']
  ),
  (
    'Tom''s Tech Vape Station',
    'tom-tech-vape-station',
    'Desktop Vaporizer von Tom Smoke',
    279.99,
    'https://images.unsplash.com/photo-1593078165509-7f0c9c187043?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1593078165509-7f0c9c187043?w=800&q=80'],
    'influencer-drops',
    6,
    true,
    true,
    tom_id,
    ARRAY['influencer', 'tom-smoke', 'vaporizer']
  ),
  (
    'Clipper Feuerzeug Set',
    'clipper-feuerzeug-set',
    '5er Pack bunte Clipper Feuerzeuge',
    9.99,
    'https://images.unsplash.com/photo-1611329427165-c5e9b1da3ba0?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1611329427165-c5e9b1da3ba0?w=800&q=80'],
    'zubehoer',
    50,
    false,
    false,
    NULL,
    ARRAY['clipper', 'feuerzeug']
  ),
  (
    'Premium Rolling Tray Gold',
    'premium-rolling-tray-gold',
    'Edle Rolling Tray aus Metall',
    24.99,
    'https://images.unsplash.com/photo-1616077167555-51f6bc516dfa?w=800&q=80',
    ARRAY['https://images.unsplash.com/photo-1616077167555-51f6bc516dfa?w=800&q=80'],
    'zubehoer',
    35,
    false,
    false,
    NULL,
    ARRAY['rolling-tray', 'gold']
  );
END $$;

-- ✅ ERFOLGSMELDUNG
SELECT '✅ Datenbank komplett neu erstellt!' as status;
SELECT COUNT(*) as anzahl_produkte FROM products;
SELECT COUNT(*) as anzahl_influencer FROM influencers;
