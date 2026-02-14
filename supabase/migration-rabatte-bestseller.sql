-- ============================================
-- RABATTCODES, PRODUKT-RABATTE, BESTSELLER & BEWERTUNGEN
-- Nach KOMPLETTES-RESET.sql oder auf bestehender DB ausführen
-- ============================================

-- 1) RABATTCODES
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percent', 'fixed')),
  value DECIMAL(10,2) NOT NULL,
  min_order_amount DECIMAL(10,2) DEFAULT NULL,
  max_uses INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  valid_until TIMESTAMP WITH TIME ZONE DEFAULT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(is_active);

ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Discount codes readable by all" ON discount_codes FOR SELECT USING (true);
CREATE POLICY "Admin manages discount codes" ON discount_codes FOR ALL
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');

-- 2) ORDERS: Rabatt-Felder
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- 3) PRODUCTS: Rabatt & Bestseller/Bewertung
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_percent INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS discount_until DATE DEFAULT NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS total_sold INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_products_total_sold ON products(total_sold);
CREATE INDEX IF NOT EXISTS idx_products_average_rating ON products(average_rating);

-- 4) PRODUKT-BEWERTUNGEN
CREATE TABLE IF NOT EXISTS product_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_product_ratings_product ON product_ratings(product_id);

ALTER TABLE product_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Ratings viewable by all" ON product_ratings FOR SELECT USING (true);
CREATE POLICY "Users can insert own rating" ON product_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON product_ratings FOR UPDATE USING (auth.uid() = user_id);

-- 5) TRIGGER: total_sold bei neuer Bestellung erhöhen
CREATE OR REPLACE FUNCTION increment_product_total_sold()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE products SET total_sold = total_sold + NEW.quantity WHERE id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_total_sold ON order_items;
CREATE TRIGGER trigger_increment_total_sold
  AFTER INSERT ON order_items
  FOR EACH ROW
  EXECUTE FUNCTION increment_product_total_sold();

-- 6) TRIGGER: average_rating & rating_count bei Bewertung aktualisieren
CREATE OR REPLACE FUNCTION update_product_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products p SET
      rating_count = (SELECT COUNT(*) FROM product_ratings WHERE product_id = OLD.product_id),
      average_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM product_ratings WHERE product_id = OLD.product_id)
    WHERE p.id = OLD.product_id;
    RETURN OLD;
  END IF;
  UPDATE products p SET
    rating_count = (SELECT COUNT(*) FROM product_ratings WHERE product_id = NEW.product_id),
    average_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM product_ratings WHERE product_id = NEW.product_id)
  WHERE p.id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_rating ON product_ratings;
CREATE TRIGGER trigger_update_product_rating
  AFTER INSERT OR UPDATE OR DELETE ON product_ratings
  FOR EACH ROW
  EXECUTE FUNCTION update_product_rating_stats();

-- 7) discount_codes updated_at
CREATE TRIGGER update_discount_codes_updated_at
  BEFORE UPDATE ON discount_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 8) Bei Bestellung mit Rabattcode: used_count erhöhen
CREATE OR REPLACE FUNCTION increment_discount_used_count()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.discount_code IS NOT NULL AND NEW.discount_code <> '' THEN
    UPDATE discount_codes
    SET used_count = used_count + 1
    WHERE code = NEW.discount_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_increment_discount_used ON orders;
CREATE TRIGGER trigger_increment_discount_used
  AFTER INSERT ON orders
  FOR EACH ROW
  EXECUTE FUNCTION increment_discount_used_count();
