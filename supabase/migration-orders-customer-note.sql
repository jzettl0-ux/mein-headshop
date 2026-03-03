-- Optionale Bestellnotiz vom Kunden (z. B. "Bitte klingeln")
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_note TEXT;
COMMENT ON COLUMN orders.order_note IS 'Optionale Anmerkung des Kunden zur Bestellung (Checkout)';
