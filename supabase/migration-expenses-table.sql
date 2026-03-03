-- Manuelle Ausgaben für BWA (Betriebswirtschaftliche Auswertung)
-- Monatliche Einträge: Miete, Gehalt, Werbung, Sonstiges etc.
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month_key TEXT NOT NULL,
  amount_eur DECIMAL(12,2) NOT NULL,
  category TEXT NOT NULL DEFAULT 'sonstige',
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Falls Tabelle schon ohne month_key existiert: Spalte nachtragen
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'month_key'
  ) THEN
    ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    ALTER TABLE expenses ADD COLUMN month_key TEXT;
    UPDATE expenses SET month_key = to_char(COALESCE(created_at, NOW()), 'YYYY-MM') WHERE month_key IS NULL;
    ALTER TABLE expenses ALTER COLUMN month_key SET NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_expenses_month ON expenses(month_key);
COMMENT ON TABLE expenses IS 'Manuelle Ausgaben pro Monat für BWA (z.B. Miete, Gehalt, Werbung)';
