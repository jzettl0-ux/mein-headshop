-- ============================================
-- UPDATE: order_items Tabelle
-- ============================================
-- Dieses Script aktualisiert die order_items Tabelle
-- mit allen benötigten Spalten
-- ============================================

-- SCHRITT 1: Alte Tabelle löschen und neu erstellen
DROP TABLE IF EXISTS order_items CASCADE;

-- SCHRITT 2: Neue Tabelle mit allen Spalten erstellen
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

-- SCHRITT 3: Index erstellen
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- SCHRITT 4: RLS aktivieren
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- SCHRITT 5: RLS Policies erstellen
DROP POLICY IF EXISTS "Users can view own order items" ON order_items;
CREATE POLICY "Users can view own order items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- SCHRITT 6: Admin kann alle sehen
DROP POLICY IF EXISTS "Admin can view all order items" ON order_items;
CREATE POLICY "Admin can view all order items"
  ON order_items FOR SELECT
  USING (
    (SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
  );

-- SCHRITT 7: Policy für INSERT (beim Checkout)
DROP POLICY IF EXISTS "Users can create order items" ON order_items;
CREATE POLICY "Users can create order items"
  ON order_items FOR INSERT
  WITH CHECK (true);

-- ✅ ERFOLGSMELDUNG
SELECT 'order_items Tabelle erfolgreich aktualisiert!' as status;

-- Prüfe die Struktur
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
