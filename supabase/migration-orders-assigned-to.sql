-- „In Bearbeitung von“ für Mitarbeiter: wer bearbeitet die Bestellung
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

COMMENT ON COLUMN orders.assigned_to_email IS 'E-Mail des Admins/Mitarbeiters, der die Bestellung gerade bearbeitet';
COMMENT ON COLUMN orders.assigned_at IS 'Zeitpunkt der Zuweisung';
