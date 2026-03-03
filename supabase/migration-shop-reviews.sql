-- ============================================
-- Allgemeine Shop-Bewertungen (Kunden + Google)
-- ============================================

CREATE TABLE IF NOT EXISTS shop_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  display_name TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'customer' CHECK (source IN ('customer', 'google')),
  moderation_status TEXT NOT NULL DEFAULT 'pending' CHECK (moderation_status IN ('pending', 'approved', 'rejected')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_reviews_status ON shop_reviews(moderation_status);
CREATE INDEX IF NOT EXISTS idx_shop_reviews_source ON shop_reviews(source);
CREATE INDEX IF NOT EXISTS idx_shop_reviews_created ON shop_reviews(created_at DESC);

COMMENT ON TABLE shop_reviews IS 'Allgemeine Shop-Bewertungen: Kunden (source=customer) und Google (source=google, manuell angelegt)';
COMMENT ON COLUMN shop_reviews.source IS 'customer = Kundenbewertung, google = von Google übernommen';
COMMENT ON COLUMN shop_reviews.moderation_status IS 'pending = wartet auf Freigabe, approved = sichtbar, rejected = abgelehnt';

ALTER TABLE shop_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Approved shop reviews are viewable by everyone"
  ON shop_reviews FOR SELECT USING (moderation_status = 'approved');

CREATE POLICY "Anyone can insert customer reviews"
  ON shop_reviews FOR INSERT WITH CHECK (source = 'customer');

CREATE POLICY "Admin can manage shop reviews"
  ON shop_reviews FOR ALL
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');
