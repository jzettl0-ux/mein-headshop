-- Bundle-Einkauf: Stück pro Bundle speichern, für schnelle Eingabe beim nächsten Mal
-- Bestand wird immer in Einzelstück gezählt (quantity = Gesamtstück)

-- Produkt: Standard „Stück pro Bundle“ für dieses Produkt (optional)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS default_bundle_size DECIMAL(12,3) NULL;

COMMENT ON COLUMN products.default_bundle_size IS 'Bei Bundle-Einkauf: typische Stückzahl pro Bundle, wird im Einkaufsformular vorausgefüllt.';

-- Einkaufsposition: optional als Bundle erfasst (für Protokoll)
ALTER TABLE purchase_items
  ADD COLUMN IF NOT EXISTS is_bundle BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS bundle_size DECIMAL(12,3) NULL,
  ADD COLUMN IF NOT EXISTS bundle_count DECIMAL(12,3) NULL;

COMMENT ON COLUMN purchase_items.is_bundle IS 'Position als Bundle erfasst (z.B. 3 Kartons à 6 Stück). quantity = Gesamtstück für Bestand.';
COMMENT ON COLUMN purchase_items.bundle_size IS 'Stück pro Bundle (wenn is_bundle).';
COMMENT ON COLUMN purchase_items.bundle_count IS 'Anzahl Bundles (wenn is_bundle).';
