-- Wasserzeichen-Einstellungen für Media-Asset-Center (ein Datensatz)
CREATE TABLE IF NOT EXISTS watermark_settings (
  id TEXT PRIMARY KEY DEFAULT 'default',
  logo_url TEXT,
  opacity DECIMAL(5,2) DEFAULT 50 CHECK (opacity >= 0 AND opacity <= 100),
  position TEXT NOT NULL DEFAULT 'bottom_right' CHECK (position IN ('top_left', 'top_right', 'bottom_left', 'bottom_right', 'center')),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO watermark_settings (id, logo_url, opacity, position)
VALUES ('default', NULL, 50, 'bottom_right')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE watermark_settings IS 'Einstellungen für automatisches Wasserzeichen auf Influencer-Assets';
