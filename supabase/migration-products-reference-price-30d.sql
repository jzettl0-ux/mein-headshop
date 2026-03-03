-- PAngV: Referenzpreis für Streichpreise = niedrigster Preis der letzten 30 Tage
-- Siehe Preisangabenverordnung (PAngV) – keine „Mondpreise“

ALTER TABLE products
  ADD COLUMN IF NOT EXISTS reference_price_30d DECIMAL(10,2) NULL;

COMMENT ON COLUMN products.reference_price_30d IS 'Niedrigster Verkaufspreis der letzten 30 Tage (PAngV). Nur wenn gesetzt und >= aktueller Preis darf ein Streichpreis angezeigt werden.';
