-- Phase 8cx.4: Verified Purchase Badge & Vine (Blueprint 10.3, 10.4)
-- is_verified_purchase: Bewertung von echtem Kauf über die Plattform (nicht storniert)
-- is_tester_program: Vine-Äquivalent – Bewertung aus Produkttester-Programm

ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS is_verified_purchase BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_tester_program BOOLEAN DEFAULT false;

COMMENT ON COLUMN product_reviews.is_verified_purchase IS 'True = Kunde hat Produkt über Plattform gekauft (nicht storniert). Badge "Verifizierter Kauf"';
COMMENT ON COLUMN product_reviews.is_tester_program IS 'True = Bewertung aus Vine/Tester-Programm (kostenloses Muster)';
