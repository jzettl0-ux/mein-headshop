-- Mehrere Pakete pro Bestellung: Zuordnung welcher Artikel in welchem Paket ist
-- order_shipment_items: (Sendung, Bestellposition, Menge) – „In Paket X liegen Q Stück von Position Y“

CREATE TABLE IF NOT EXISTS order_shipment_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shipment_id UUID NOT NULL REFERENCES order_shipments(id) ON DELETE CASCADE,
  order_item_id UUID NOT NULL REFERENCES order_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(shipment_id, order_item_id)
);

CREATE INDEX IF NOT EXISTS idx_order_shipment_items_shipment ON order_shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_order_shipment_items_order_item ON order_shipment_items(order_item_id);

COMMENT ON TABLE order_shipment_items IS 'Zuordnung: Welche Bestellpositionen (und wie viele) stecken in welcher Sendung. Ermöglicht mehrere Pakete mit klarer Inhalt-Angabe.';

ALTER TABLE order_shipment_items ENABLE ROW LEVEL SECURITY;

-- Policies: DROP IF EXISTS, damit Migration mehrfach ausführbar ist
DROP POLICY IF EXISTS "Users can view own order shipment items" ON order_shipment_items;
CREATE POLICY "Users can view own order shipment items"
  ON order_shipment_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_shipments s
      JOIN orders o ON o.id = s.order_id
      WHERE s.id = order_shipment_items.shipment_id
      AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can view order shipment items" ON order_shipment_items;
CREATE POLICY "Admin can view order shipment items"
  ON order_shipment_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_shipments s
      JOIN orders o ON o.id = s.order_id
      WHERE s.id = order_shipment_items.shipment_id
    )
  );

DROP POLICY IF EXISTS "Admin can insert order shipment items" ON order_shipment_items;
CREATE POLICY "Admin can insert order shipment items"
  ON order_shipment_items FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'email') IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM order_shipments s
      JOIN orders o ON o.id = s.order_id
      WHERE s.id = order_shipment_items.shipment_id
    )
  );

DROP POLICY IF EXISTS "Admin can update order shipment items" ON order_shipment_items;
CREATE POLICY "Admin can update order shipment items"
  ON order_shipment_items FOR UPDATE
  USING (
    (SELECT auth.jwt() ->> 'email') IS NOT NULL
  );

DROP POLICY IF EXISTS "Admin can delete order shipment items" ON order_shipment_items;
CREATE POLICY "Admin can delete order shipment items"
  ON order_shipment_items FOR DELETE
  USING (
    (SELECT auth.jwt() ->> 'email') IS NOT NULL
  );
