-- Versandcode und Rücksendekosten-Abzug bei angenommener Rücksendung.
-- Der Kunde erhält den Versandcode per E-Mail; die Rücksendekosten werden von der Erstattung abgezogen.

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_shipping_code TEXT,
  ADD COLUMN IF NOT EXISTS return_shipping_deduction_cents INTEGER;

COMMENT ON COLUMN orders.return_shipping_code IS 'Versandcode (z. B. DHL Retourenschein) – wird dem Kunden bei Annahme der Rücksendung per E-Mail geschickt';
COMMENT ON COLUMN orders.return_shipping_deduction_cents IS 'Betrag in Cent, der von der Rückerstattung abgezogen wird (Rücksendekosten)';
