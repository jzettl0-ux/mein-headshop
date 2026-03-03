-- Private Bewertungen: nur für Shop-Betreiber sichtbar, nicht öffentlich
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT false;

COMMENT ON COLUMN product_reviews.is_private IS 'Wenn true: Bewertung fließt in Durchschnitt ein, erscheint aber nicht in der öffentlichen Liste.';
