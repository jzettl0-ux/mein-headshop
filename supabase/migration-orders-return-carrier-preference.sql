-- Kundenwunsch: Mit welchem Versanddienstleister soll die Rücksendung erfolgen? (wird bei der Rücksendeanfrage angegeben.)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_carrier_preference TEXT;

COMMENT ON COLUMN orders.return_carrier_preference IS 'Vom Kunden gewählter Versanddienstleister bei der Rücksendeanfrage (z. B. dhl, dpd).';
