-- Status für Storno-/Rücksendeanfragen (Admin kann annehmen/ablehnen)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancellation_request_status TEXT DEFAULT 'pending'
    CHECK (cancellation_request_status IS NULL OR cancellation_request_status IN ('pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS return_request_status TEXT DEFAULT 'pending'
    CHECK (return_request_status IS NULL OR return_request_status IN ('pending', 'approved', 'rejected'));

COMMENT ON COLUMN orders.cancellation_request_status IS 'Admin: pending = offen, approved = angenommen, rejected = abgelehnt';
COMMENT ON COLUMN orders.return_request_status IS 'Admin: pending = offen, approved = angenommen, rejected = abgelehnt';

-- Welche Artikel betreffen die Anfrage? (einzelne Artikel stornieren/zurückschicken)
CREATE TABLE IF NOT EXISTS order_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('cancellation', 'return')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (order_id, order_item_id, request_type)
);

CREATE INDEX IF NOT EXISTS idx_order_request_items_order ON order_request_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_request_items_type ON order_request_items(request_type);

COMMENT ON TABLE order_request_items IS 'Welche Bestellpositionen sind von Storno-/Rücksendeanfrage betroffen (Kunde wählt einzelne Artikel)';

-- RLS: Nur Service Role (Backend) darf zugreifen
ALTER TABLE order_request_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "no_direct_access_order_request_items" ON order_request_items;
CREATE POLICY "no_direct_access_order_request_items"
  ON order_request_items FOR ALL
  USING (false)
  WITH CHECK (false);
