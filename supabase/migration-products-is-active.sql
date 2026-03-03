-- Produkte: „Im Shop anzeigen“ (aktiv/inaktiv)
-- Inaktiv = nur im Admin sichtbar, z. B. für Kostenrechner, bis du es freigibst.

ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT true;

COMMENT ON COLUMN products.is_active IS 'false = nur im Admin sichtbar (z. B. Kostenrechner), nicht im Shop. true = im Shop angezeigt.';

CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(is_active) WHERE is_active = true;
