-- Wareneingang-Tracking: Einkauf erfassen ohne sofortige Bestandserhöhung,
-- dann im Wareneingang buchen wenn die Ware da ist.

-- purchase_items: bereits eingegangene Menge pro Position
ALTER TABLE purchase_items
  ADD COLUMN IF NOT EXISTS quantity_received DECIMAL(12,3) NOT NULL DEFAULT 0;

COMMENT ON COLUMN purchase_items.quantity_received IS 'Bereits im Wareneingang gebuchte Menge (bis quantity). Rest wird bei Wareneingang gebucht.';
