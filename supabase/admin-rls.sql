-- ============================================
-- ADMIN ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================
-- Diese Policies stellen sicher, dass nur der Admin
-- Produkte und Influencer bearbeiten kann
-- ============================================

-- Admin E-Mail
-- WICHTIG: Ändere dies, wenn du eine andere Admin-Email nutzt
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT auth.jwt() ->> 'email' = 'jzettl0@gmail.com'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- Jeder kann Produkte sehen (öffentlich)
DROP POLICY IF EXISTS "Products are viewable by everyone" ON products;
CREATE POLICY "Products are viewable by everyone"
  ON products FOR SELECT
  USING (stock > 0);

-- Nur Admin kann Produkte erstellen
DROP POLICY IF EXISTS "Admin can create products" ON products;
CREATE POLICY "Admin can create products"
  ON products FOR INSERT
  WITH CHECK (is_admin());

-- Nur Admin kann Produkte aktualisieren
DROP POLICY IF EXISTS "Admin can update products" ON products;
CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  USING (is_admin());

-- Nur Admin kann Produkte löschen
DROP POLICY IF EXISTS "Admin can delete products" ON products;
CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  USING (is_admin());

-- ============================================
-- INFLUENCERS POLICIES
-- ============================================

-- Jeder kann aktive Influencer sehen (öffentlich)
DROP POLICY IF EXISTS "Influencers are viewable by everyone" ON influencers;
CREATE POLICY "Influencers are viewable by everyone"
  ON influencers FOR SELECT
  USING (is_active = true);

-- Nur Admin kann Influencer erstellen
DROP POLICY IF EXISTS "Admin can create influencers" ON influencers;
CREATE POLICY "Admin can create influencers"
  ON influencers FOR INSERT
  WITH CHECK (is_admin());

-- Nur Admin kann Influencer aktualisieren
DROP POLICY IF EXISTS "Admin can update influencers" ON influencers;
CREATE POLICY "Admin can update influencers"
  ON influencers FOR UPDATE
  USING (is_admin());

-- Nur Admin kann Influencer löschen
DROP POLICY IF EXISTS "Admin can delete influencers" ON influencers;
CREATE POLICY "Admin can delete influencers"
  ON influencers FOR DELETE
  USING (is_admin());

-- ============================================
-- ORDERS POLICIES (bereits vorhanden, aber verbessert)
-- ============================================

-- User können nur eigene Bestellungen sehen
DROP POLICY IF EXISTS "Users can view own orders" ON orders;
CREATE POLICY "Users can view own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

-- Admin kann ALLE Bestellungen sehen
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  USING (is_admin());

-- Admin kann Bestellungen aktualisieren (Status ändern)
DROP POLICY IF EXISTS "Admin can update orders" ON orders;
CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  USING (is_admin());

-- User können Bestellungen erstellen
DROP POLICY IF EXISTS "Users can create orders" ON orders;
CREATE POLICY "Users can create orders"
  ON orders FOR INSERT
  WITH CHECK (true);

-- ============================================
-- ORDER_ITEMS POLICIES
-- ============================================

-- User können nur eigene Bestellpositionen sehen
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

-- Admin kann ALLE Bestellpositionen sehen
DROP POLICY IF EXISTS "Admin can view all order items" ON order_items;
CREATE POLICY "Admin can view all order items"
  ON order_items FOR SELECT
  USING (is_admin());

-- ============================================
-- STORAGE POLICIES (für Bild-Uploads)
-- ============================================

-- Jeder kann Bilder SEHEN
DROP POLICY IF EXISTS "Public product images are viewable by everyone" ON storage.objects;
CREATE POLICY "Public product images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Public influencer images are viewable by everyone" ON storage.objects;
CREATE POLICY "Public influencer images are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'influencer-images');

-- Nur Admin kann Bilder HOCHLADEN
DROP POLICY IF EXISTS "Admin can upload product images" ON storage.objects;
CREATE POLICY "Admin can upload product images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'product-images'
    AND is_admin()
  );

DROP POLICY IF EXISTS "Admin can upload influencer images" ON storage.objects;
CREATE POLICY "Admin can upload influencer images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'influencer-images'
    AND is_admin()
  );

-- Nur Admin kann Bilder LÖSCHEN
DROP POLICY IF EXISTS "Admin can delete product images" ON storage.objects;
CREATE POLICY "Admin can delete product images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'product-images'
    AND is_admin()
  );

DROP POLICY IF EXISTS "Admin can delete influencer images" ON storage.objects;
CREATE POLICY "Admin can delete influencer images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'influencer-images'
    AND is_admin()
  );

-- ============================================
-- ERFOLGSMELDUNG
-- ============================================
-- Wenn du das hier siehst, wurden alle RLS Policies erfolgreich erstellt! 🎉
-- 
-- Was wurde gesichert:
-- ✅ Nur Admin kann Produkte erstellen/bearbeiten/löschen
-- ✅ Nur Admin kann Influencer erstellen/bearbeiten/löschen
-- ✅ Nur Admin kann alle Bestellungen sehen
-- ✅ Nur Admin kann Bilder hochladen/löschen
-- ✅ User können nur eigene Bestellungen sehen
-- ✅ Alle können Produkte und Influencer sehen (read-only)
-- ============================================

-- Teste die Policies:
-- SELECT is_admin(); -- Sollte true oder false zurückgeben
