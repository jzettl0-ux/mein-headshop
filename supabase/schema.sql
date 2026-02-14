-- ============================================
-- MEIN HEADSHOP - SUPABASE DATABASE SCHEMA
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  accent_color TEXT DEFAULT '#D4AF37', -- Gold
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
-- INDEXES for Performance
-- ============================================
CREATE INDEX idx_products_category ON products(category);
CREATE INDEX idx_products_influencer ON products(influencer_id);
CREATE INDEX idx_products_featured ON products(is_featured);
CREATE INDEX idx_products_adult ON products(is_adult_only);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_customer ON orders(customer_email);
CREATE INDEX idx_order_items_order ON order_items(order_id);

-- ============================================
-- UPDATED_AT TRIGGER
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
-- ROW LEVEL SECURITY (RLS)
-- ============================================

-- Enable RLS
ALTER TABLE influencers ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Public read access for influencers
CREATE POLICY "Influencers are viewable by everyone"
  ON influencers FOR SELECT
  USING (is_active = true);

-- Public read access for products
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (stock > 0);

-- Orders: Users can only see their own orders
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- Order items: Users can only see their own order items
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- STORAGE BUCKETS
-- ============================================

-- Product images bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Influencer images bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('influencer-images', 'influencer-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Public product images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "Public influencer images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'influencer-images');

-- ============================================
-- SEED DATA (Optional - for testing)
-- ============================================

-- Insert sample influencer
INSERT INTO influencers (name, slug, bio, accent_color, is_active)
VALUES 
  ('Max Grün', 'max-gruen', 'Premium Cannabis Content Creator', '#39FF14', true),
  ('Lisa High', 'lisa-high', 'High-End Lifestyle & Cannabis', '#D4AF37', true);

-- Insert sample products
INSERT INTO products (name, slug, description, price, category, stock, is_adult_only, is_featured, tags)
VALUES 
  ('Premium Glaspfeife', 'premium-glaspfeife', 'Handgefertigte Glaspfeife aus Borosilikatglas', 49.99, 'bongs', 10, true, true, ARRAY['premium', 'glas']),
  ('XXL Grinder Gold', 'xxl-grinder-gold', 'Hochwertig CNC-gefrästes Alugrinder mit Kief-Fänger', 34.99, 'grinder', 25, false, true, ARRAY['grinder', 'gold']),
  ('RAW King Size Papers', 'raw-king-size', 'Natürliche ungebleichte Papers', 3.99, 'papers', 100, false, false, ARRAY['papers', 'raw']);
