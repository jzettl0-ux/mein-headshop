-- Phase 7.4: Bestimmungsland für OSS/Deemed-Seller EU-VAT

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS destination_country VARCHAR(2) DEFAULT 'DE';

COMMENT ON COLUMN orders.destination_country IS 'Bestimmungsland (ISO 2) aus Lieferadresse – für OSS-Meldung und Deemed-Seller-Prüfung';

CREATE INDEX IF NOT EXISTS idx_orders_destination_country ON orders(destination_country) WHERE destination_country IS NOT NULL AND destination_country != 'DE';
