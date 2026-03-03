-- Status pro Bestellposition: nur bestimmte Artikel als storniert oder zurückgesendet markieren.
-- active = normal, cancelled = storniert (z. B. nach Stornierungsanfrage angenommen), returned = zurückgesendet (Rücksendung eingegangen).

ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS item_status TEXT DEFAULT 'active'
  CHECK (item_status IS NULL OR item_status IN ('active', 'cancelled', 'returned'));

COMMENT ON COLUMN order_items.item_status IS 'Pro Artikel: active=normal, cancelled=storniert, returned=zurückgesendet (Rücksendung eingegangen)';
