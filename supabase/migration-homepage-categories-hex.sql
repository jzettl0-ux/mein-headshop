-- Eigene Farben für Startseiten-Kategorien (Hex)
ALTER TABLE homepage_categories
  ADD COLUMN IF NOT EXISTS gradient_start_hex TEXT,
  ADD COLUMN IF NOT EXISTS gradient_end_hex TEXT,
  ADD COLUMN IF NOT EXISTS icon_color_hex TEXT;

COMMENT ON COLUMN homepage_categories.gradient_start_hex IS 'Verlauf Startfarbe (z. B. #D4AF37) – optional, sonst Tailwind gradient';
COMMENT ON COLUMN homepage_categories.gradient_end_hex IS 'Verlauf Endfarbe (z. B. #F59E0B)';
COMMENT ON COLUMN homepage_categories.icon_color_hex IS 'Icon/Buchstaben-Farbe (z. B. #D4AF37)';
