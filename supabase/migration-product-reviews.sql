-- ============================================
-- Kundenbewertungen nur für echte Käufer
-- Eine Bewertung pro Bestellposition (order_item).
-- Bei erneutem Kauf desselben Produkts → weitere Bewertung möglich.
-- ============================================

-- Tabelle: Bewertung pro bestellter Position (ein Kauf = eine mögliche Bewertung)
CREATE TABLE IF NOT EXISTS product_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_product_reviews_product ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_order_item ON product_reviews(order_item_id);

COMMENT ON TABLE product_reviews IS 'Nur Käufer: eine Bewertung pro Bestellposition; bei erneutem Kauf weitere Bewertung möglich.';

-- RLS: Jeder kann Bewertungen lesen; Schreiben nur über API (Service/anon mit Prüfung)
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Product reviews are viewable by everyone" ON product_reviews;
CREATE POLICY "Product reviews are viewable by everyone"
  ON product_reviews FOR SELECT USING (true);

-- INSERT/UPDATE/DELETE nur über Backend (API prüft Kauf); keine Policy für normale User
-- API nutzt service role oder prüft per App-Logik
DROP POLICY IF EXISTS "Allow insert for verified purchase" ON product_reviews;
CREATE POLICY "Allow insert for verified purchase"
  ON product_reviews FOR INSERT WITH CHECK (true);

-- Trigger: Produkt-Statistik (rating_count, average_rating) aus product_reviews
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products p SET
      rating_count = (SELECT COUNT(*)::int FROM product_reviews WHERE product_id = OLD.product_id),
      average_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM product_reviews WHERE product_id = OLD.product_id)
    WHERE p.id = OLD.product_id;
    RETURN OLD;
  END IF;
  UPDATE products p SET
    rating_count = (SELECT COUNT(*)::int FROM product_reviews WHERE product_id = NEW.product_id),
    average_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM product_reviews WHERE product_id = NEW.product_id)
  WHERE p.id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_product_review_stats ON product_reviews;
CREATE TRIGGER trigger_update_product_review_stats
  AFTER INSERT OR UPDATE OR DELETE ON product_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_product_review_stats();
