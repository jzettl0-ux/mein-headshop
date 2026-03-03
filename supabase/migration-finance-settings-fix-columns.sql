-- Stellt sicher, dass finance_settings alle erwarteten Spalten hat
-- (falls die Tabelle schon ohne sie angelegt wurde)

-- Tabelle anlegen, falls nicht vorhanden
CREATE TABLE IF NOT EXISTS finance_settings (
  id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fehlende Spalten ergaenzen (jeweils mit Default)
ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS tax_rate DECIMAL(5,2) DEFAULT 30;
ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS mollie_fixed DECIMAL(10,2) DEFAULT 0.29;
ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS mollie_percent DECIMAL(5,2) DEFAULT 0.25;
ALTER TABLE finance_settings ADD COLUMN IF NOT EXISTS revenue_limit DECIMAL(10,2) DEFAULT 22500;

-- NULL-Werte beheben
UPDATE finance_settings SET tax_rate = 30 WHERE tax_rate IS NULL;
UPDATE finance_settings SET mollie_fixed = 0.29 WHERE mollie_fixed IS NULL;
UPDATE finance_settings SET mollie_percent = 0.25 WHERE mollie_percent IS NULL;
UPDATE finance_settings SET revenue_limit = 22500 WHERE revenue_limit IS NULL;

-- NOT NULL setzen, nachdem alle Zeilen Werte haben
ALTER TABLE finance_settings ALTER COLUMN tax_rate SET NOT NULL, ALTER COLUMN tax_rate SET DEFAULT 30;
ALTER TABLE finance_settings ALTER COLUMN mollie_fixed SET NOT NULL, ALTER COLUMN mollie_fixed SET DEFAULT 0.29;
ALTER TABLE finance_settings ALTER COLUMN mollie_percent SET NOT NULL, ALTER COLUMN mollie_percent SET DEFAULT 0.25;
ALTER TABLE finance_settings ALTER COLUMN revenue_limit SET NOT NULL, ALTER COLUMN revenue_limit SET DEFAULT 22500;

-- Zeile mit Werten sicherstellen (id je nach Tabelle INTEGER oder UUID; key-Spalte falls vorhanden)
DO $$
DECLARE
  has_key_col INT;
BEGIN
  SELECT COUNT(*) INTO has_key_col FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'finance_settings' AND column_name = 'key';

  IF (SELECT data_type FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'finance_settings' AND column_name = 'id') = 'uuid' THEN
    IF has_key_col > 0 THEN
      INSERT INTO finance_settings (id, key, tax_rate, mollie_fixed, mollie_percent, revenue_limit)
      VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 'default', 30, 0.29, 0.25, 22500)
      ON CONFLICT (id) DO UPDATE SET
        tax_rate = EXCLUDED.tax_rate,
        mollie_fixed = EXCLUDED.mollie_fixed,
        mollie_percent = EXCLUDED.mollie_percent,
        revenue_limit = EXCLUDED.revenue_limit,
        updated_at = NOW();
    ELSE
      INSERT INTO finance_settings (id, tax_rate, mollie_fixed, mollie_percent, revenue_limit)
      VALUES ('00000000-0000-0000-0000-000000000001'::uuid, 30, 0.29, 0.25, 22500)
      ON CONFLICT (id) DO UPDATE SET
        tax_rate = EXCLUDED.tax_rate,
        mollie_fixed = EXCLUDED.mollie_fixed,
        mollie_percent = EXCLUDED.mollie_percent,
        revenue_limit = EXCLUDED.revenue_limit,
        updated_at = NOW();
    END IF;
  ELSE
    IF has_key_col > 0 THEN
      INSERT INTO finance_settings (id, key, tax_rate, mollie_fixed, mollie_percent, revenue_limit)
      VALUES (1, 'default', 30, 0.29, 0.25, 22500)
      ON CONFLICT (id) DO UPDATE SET
        tax_rate = EXCLUDED.tax_rate,
        mollie_fixed = EXCLUDED.mollie_fixed,
        mollie_percent = EXCLUDED.mollie_percent,
        revenue_limit = EXCLUDED.revenue_limit,
        updated_at = NOW();
    ELSE
      INSERT INTO finance_settings (id, tax_rate, mollie_fixed, mollie_percent, revenue_limit)
      VALUES (1, 30, 0.29, 0.25, 22500)
      ON CONFLICT (id) DO UPDATE SET
        tax_rate = EXCLUDED.tax_rate,
        mollie_fixed = EXCLUDED.mollie_fixed,
        mollie_percent = EXCLUDED.mollie_percent,
        revenue_limit = EXCLUDED.revenue_limit,
        updated_at = NOW();
    END IF;
  END IF;
END $$;
