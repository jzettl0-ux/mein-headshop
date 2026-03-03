-- Sendungsverfolgung: DHL (oder andere) Sendungsnummer + optional Carrier
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_carrier TEXT DEFAULT 'DHL';
