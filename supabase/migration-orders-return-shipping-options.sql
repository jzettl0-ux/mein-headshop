-- Versanddienstleister-Optionen bei Rücksendung: fester Träger oder Kundenwahl mit Preisanzeige.
-- return_shipping_options: JSONB-Array [{ "carrier": "dhl", "label": "DHL", "price_cents": 499 }, ...]
-- Länge 1 = fester Versanddienstleister (Kunde muss diesen nutzen), Länge > 1 = Kunde wählt (Preise angezeigt).

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS return_shipping_options JSONB DEFAULT '[]';

COMMENT ON COLUMN orders.return_shipping_options IS 'Rücksende-Optionen: [{ carrier, label, price_cents }]. Ein Eintrag = fester Träger, mehrere = Kunde wählt mit Preisanzeige.';
