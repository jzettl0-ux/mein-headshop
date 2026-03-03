-- ============================================
-- Rechtstexte im Shop bearbeitbar (Impressum, Datenschutz, AGB, Widerruf)
-- ============================================

CREATE TABLE IF NOT EXISTS legal_texts (
  slug TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE legal_texts IS 'Rechtstexte: Impressum, Datenschutz, AGB, Widerrufsbelehrung – im Admin bearbeitbar, Platzhalter {{company_name}} etc.';

CREATE INDEX IF NOT EXISTS idx_legal_texts_updated_at ON legal_texts(updated_at);

ALTER TABLE legal_texts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Legal texts readable by everyone"
  ON legal_texts FOR SELECT USING (true);

CREATE POLICY "Legal texts writable by service role only"
  ON legal_texts FOR ALL USING (false) WITH CHECK (false);

-- Einträge anlegen (leerer Inhalt = Frontend nutzt weiter die eingebauten Muster)
INSERT INTO legal_texts (slug, title, content) VALUES
  ('impressum', 'Impressum', ''),
  ('privacy', 'Datenschutzerklärung', ''),
  ('terms', 'AGB', ''),
  ('returns', 'Widerrufsbelehrung', '')
ON CONFLICT (slug) DO UPDATE SET title = EXCLUDED.title;

CREATE OR REPLACE FUNCTION set_legal_texts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS legal_texts_updated_at ON legal_texts;
CREATE TRIGGER legal_texts_updated_at
  BEFORE UPDATE ON legal_texts
  FOR EACH ROW EXECUTE FUNCTION set_legal_texts_updated_at();
