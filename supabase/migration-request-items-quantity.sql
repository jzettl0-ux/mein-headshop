-- Mengenangabe bei Storno-/Rücksendeanfragen: wie viele Stück pro Artikel (z. B. 2 von 3 zurücksenden).

-- order_request_items: angefragte Menge pro Position (NULL = komplette Menge der Bestellzeile)
ALTER TABLE order_request_items
  ADD COLUMN IF NOT EXISTS requested_quantity INTEGER;

COMMENT ON COLUMN order_request_items.requested_quantity IS 'Angefragte Menge für diese Position (Storno/Rücksendung). NULL = komplette Menge der Bestellzeile.';

-- order_items: wie viele bereits storniert / zurückgesendet (für Teilmengen)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS cancelled_quantity INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS returned_quantity INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN order_items.cancelled_quantity IS 'Anzahl der Stück dieser Position, die storniert wurden (Summe bei Teilstornierungen).';
COMMENT ON COLUMN order_items.returned_quantity IS 'Anzahl der Stück dieser Position, die zurückgesendet wurden.';
