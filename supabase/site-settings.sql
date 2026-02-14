-- ============================================
-- Site Settings / Branding (Key-Value)
-- ============================================
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Default Branding-Farben (Hex)
INSERT INTO site_settings (key, value) VALUES
  ('branding_primary', '#D4AF37'),
  ('branding_accent', '#39FF14'),
  ('branding_charcoal', '#1A1A1A'),
  ('branding_black', '#0A0A0A'),
  ('branding_gray', '#2A2A2A'),
  ('branding_silver', '#8A8A8A')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Jeder darf lesen (für Frontend)
CREATE POLICY "Site settings are viewable by everyone"
  ON site_settings FOR SELECT
  USING (true);

-- Nur Admin darf schreiben
CREATE POLICY "Admin can update site settings"
  ON site_settings FOR ALL
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');
