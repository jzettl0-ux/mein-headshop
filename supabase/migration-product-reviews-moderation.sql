-- Moderation: Bewertungen genehmigen/ablehnen; nur genehmigte erscheinen im Shop.
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS moderation_status TEXT DEFAULT 'pending'
  CHECK (moderation_status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN product_reviews.moderation_status IS 'pending = warten auf Freigabe, approved = im Shop sichtbar, rejected = abgelehnt (nicht sichtbar)';

-- Bestehende Bewertungen als genehmigt betrachten
UPDATE product_reviews SET moderation_status = 'approved' WHERE moderation_status IS NULL OR moderation_status = 'pending';

-- Trigger anpassen: Nur genehmigte Bewertungen in rating_count / average_rating
CREATE OR REPLACE FUNCTION update_product_review_stats()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    UPDATE products p SET
      rating_count = (SELECT COUNT(*)::int FROM product_reviews WHERE product_id = OLD.product_id AND (moderation_status = 'approved' OR moderation_status IS NULL)),
      average_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM product_reviews WHERE product_id = OLD.product_id AND (moderation_status = 'approved' OR moderation_status IS NULL))
    WHERE p.id = OLD.product_id;
    RETURN OLD;
  END IF;
  UPDATE products p SET
    rating_count = (SELECT COUNT(*)::int FROM product_reviews WHERE product_id = NEW.product_id AND (moderation_status = 'approved' OR moderation_status IS NULL)),
    average_rating = (SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0) FROM product_reviews WHERE product_id = NEW.product_id AND (moderation_status = 'approved' OR moderation_status IS NULL))
  WHERE p.id = NEW.product_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Review-Request: Nach Versand nach 10 Tagen E-Mail senden (Tracking)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS review_request_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.review_request_sent_at IS 'Zeitpunkt, zu dem die Bewertungsanfrage-E-Mail versendet wurde (z. B. 10 Tage nach Versand).';

-- Einmalig: Produkt-Statistiken aus genehmigten Bewertungen neu berechnen
UPDATE products p SET
  rating_count = (SELECT COUNT(*)::int FROM product_reviews pr WHERE pr.product_id = p.id AND (pr.moderation_status = 'approved' OR pr.moderation_status IS NULL)),
  average_rating = (SELECT COALESCE(ROUND(AVG(pr.rating)::numeric, 2), 0) FROM product_reviews pr WHERE pr.product_id = p.id AND (pr.moderation_status = 'approved' OR pr.moderation_status IS NULL));
