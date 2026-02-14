-- Influencer auf Startseite: Auswahl und Individualisierung
ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS show_on_homepage BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS homepage_order INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS homepage_title TEXT,
  ADD COLUMN IF NOT EXISTS homepage_bio TEXT;

COMMENT ON COLUMN influencers.show_on_homepage IS 'Auf der Startseite im Influencer-Bereich anzeigen';
COMMENT ON COLUMN influencers.homepage_order IS 'Reihenfolge auf der Startseite (kleiner = weiter vorne)';
COMMENT ON COLUMN influencers.homepage_title IS 'Optional: eigener Titel nur für die Startseiten-Karte';
COMMENT ON COLUMN influencers.homepage_bio IS 'Optional: eigener Bio-Text nur für die Startseiten-Karte';
