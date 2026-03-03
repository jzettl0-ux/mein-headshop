-- Zuweisung an Mitarbeiter (falls noch nicht vorhanden)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_to_email TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;
COMMENT ON COLUMN orders.assigned_to_email IS 'E-Mail des Admins/Mitarbeiters, der die Bestellung bearbeitet';
COMMENT ON COLUMN orders.assigned_at IS 'Zeitpunkt der Zuweisung';

-- Bearbeitungsstatus für Kollegen (z. B. bei Krankheit weitermachen)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processing_status TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS processing_notes TEXT;
COMMENT ON COLUMN orders.processing_status IS 'Bearbeitungsstand: picking, packing, packed, ready_to_ship';
COMMENT ON COLUMN orders.processing_notes IS 'Freitext für Kollegen: z. B. welche Pakete befüllt, Verpackung';
