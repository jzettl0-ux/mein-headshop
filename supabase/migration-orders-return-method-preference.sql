-- Kundenwunsch bei Rücksendeanfrage: gedruckter Code oder QR-Code
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_method_preference TEXT
    CHECK (return_method_preference IS NULL OR return_method_preference IN ('printed_code', 'qr_code'));

COMMENT ON COLUMN orders.return_method_preference IS 'Vom Kunden gewählt vor Absenden der Rücksendeanfrage: printed_code = gedruckter Retourenschein, qr_code = QR-Code (druckerlose Retoure).';
