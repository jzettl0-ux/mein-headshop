-- Saisonale Events fuer Trend-Analyse und Einkaufsempfehlungen
CREATE TABLE IF NOT EXISTS seasonal_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  event_month SMALLINT NOT NULL CHECK (event_month >= 1 AND event_month <= 12),
  event_day SMALLINT NOT NULL CHECK (event_day >= 1 AND event_day <= 31),
  expected_growth_factor DECIMAL(5,2) NOT NULL DEFAULT 1.00,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE seasonal_events IS 'Saisonale Events (z. B. 4/20, Black Friday) fuer Trend-Analyse und Einkaufsempfehlungen';
COMMENT ON COLUMN seasonal_events.expected_growth_factor IS 'Erwarteter Faktor vs. Vorjahr (1.0 = gleich, 1.5 = 50 % mehr Nachfrage)';

-- Falls Tabelle schon ohne "name" existiert: Spalte nachtraegen
DO $$
DECLARE
  has_month INT;
  has_day INT;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'seasonal_events' AND column_name = 'name'
  ) THEN
    ALTER TABLE seasonal_events ADD COLUMN name TEXT;
    SELECT COUNT(*) INTO has_month FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'seasonal_events' AND column_name = 'event_month';
    SELECT COUNT(*) INTO has_day FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'seasonal_events' AND column_name = 'event_day';
    IF has_month > 0 AND has_day > 0 THEN
      UPDATE seasonal_events SET name = 'Event ' || event_month || '/' || event_day WHERE name IS NULL;
    ELSE
      UPDATE seasonal_events SET name = 'Event' WHERE name IS NULL;
    END IF;
    ALTER TABLE seasonal_events ALTER COLUMN name SET NOT NULL;
  END IF;
END $$;

-- Beispieldaten: 4/20 und Black Friday (nur wenn Spalten event_month/event_day existieren)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seasonal_events' AND column_name = 'event_month')
     AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seasonal_events' AND column_name = 'event_day') THEN
    INSERT INTO seasonal_events (name, event_month, event_day, expected_growth_factor, notes)
    SELECT '4/20', 4, 20, 1.40, 'Saisonhoch im April'
    WHERE NOT EXISTS (SELECT 1 FROM seasonal_events WHERE event_month = 4 AND event_day = 20);
    INSERT INTO seasonal_events (name, event_month, event_day, expected_growth_factor, notes)
    SELECT 'Black Friday', 11, 29, 1.60, 'November'
    WHERE NOT EXISTS (SELECT 1 FROM seasonal_events WHERE event_month = 11 AND event_day = 29);
  END IF;
END $$;
