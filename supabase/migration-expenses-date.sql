-- Ausgaben: Datum auf den Tag genau (nicht nur Monat)
-- expense_date = tatsächliches Rechnungs-/Buchungsdatum
-- month_key bleibt für BWA-Aggregation (YYYY-MM), wird aus expense_date abgeleitet

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS expense_date DATE;

-- Bestehende Zeilen: expense_date aus month_key ableiten (Mitte des Monats als Fallback)
UPDATE expenses
SET expense_date = (month_key || '-15')::date
WHERE expense_date IS NULL AND month_key ~ '^\d{4}-\d{2}$';

-- Fallback für ungültige month_key: created_at
UPDATE expenses
SET expense_date = created_at::date
WHERE expense_date IS NULL;

COMMENT ON COLUMN expenses.expense_date IS 'Tatsächliches Datum der Ausgabe (Rechnungsdatum/Buchungsdatum). month_key für BWA aus expense_date ableitbar.';
