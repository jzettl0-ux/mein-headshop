-- Mollie Payment-ID an Bestellung speichern (für Sync nach Rückkehr von Mollie)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mollie_payment_id TEXT;
