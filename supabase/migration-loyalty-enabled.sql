-- Loyalty-Programm ein-/ausschaltbar (z. B. für den Start pausieren)
INSERT INTO loyalty_settings (key, value, updated_at) VALUES
  ('enabled', 'true', NOW())
ON CONFLICT (key) DO NOTHING;

COMMENT ON TABLE loyalty_settings IS 'Einstellungen: u. a. enabled (true/false), points_per_euro, ...';
