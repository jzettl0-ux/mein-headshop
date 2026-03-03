-- Rücksendeanfrage durch Kunden (Paket zurückschicken).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS return_reason TEXT,
  ADD COLUMN IF NOT EXISTS return_reason_other TEXT;

COMMENT ON COLUMN orders.return_requested_at IS 'Zeitpunkt der Rücksendeanfrage durch den Kunden';
COMMENT ON COLUMN orders.return_reason IS 'Vorgewählter Grund (z. B. defekt, sonstiges)';
COMMENT ON COLUMN orders.return_reason_other IS 'Freitext bei Sonstiges';
