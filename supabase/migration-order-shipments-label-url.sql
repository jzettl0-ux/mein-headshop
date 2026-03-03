-- Label-Speicherung und shipped_at für order_shipments (Phase 2 – DHL API & Logistik)
-- label_url: URL zum DHL Versandlabel (PDF); kann ablaufen – optional lokal speichern
-- return_label_url: URL zum Retourenlabel
-- shipped_at: Zeitpunkt, zu dem die Sendung als versandt markiert wurde

ALTER TABLE order_shipments
  ADD COLUMN IF NOT EXISTS label_url TEXT,
  ADD COLUMN IF NOT EXISTS return_label_url TEXT,
  ADD COLUMN IF NOT EXISTS shipped_at TIMESTAMPTZ;

COMMENT ON COLUMN order_shipments.label_url IS 'URL zum DHL Versandlabel-PDF (kann zeitlich begrenzt gültig sein)';
COMMENT ON COLUMN order_shipments.return_label_url IS 'URL zum DHL Retourenlabel-PDF';
COMMENT ON COLUMN order_shipments.shipped_at IS 'Zeitpunkt des Versands';
