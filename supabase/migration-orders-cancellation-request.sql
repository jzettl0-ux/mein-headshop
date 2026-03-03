-- Stornierungsanfrage durch Kunden (kein direktes Stornieren mehr)
-- Kunde kann optional einen Grund angeben (Vorgaben + Sonstiges).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_requested_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
  ADD COLUMN IF NOT EXISTS cancellation_reason_other TEXT;

COMMENT ON COLUMN orders.cancellation_requested_at IS 'Zeitpunkt der Stornierungsanfrage durch den Kunden';
COMMENT ON COLUMN orders.cancellation_reason IS 'Vorgewählter Grund (z. B. doppelt_bestellt, sonstiges)';
COMMENT ON COLUMN orders.cancellation_reason_other IS 'Freitext bei Sonstiges';
