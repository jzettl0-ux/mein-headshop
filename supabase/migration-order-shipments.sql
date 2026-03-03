-- Mehrere Sendungen pro Bestellung (order_shipments)
-- Bestehende tracking_number/tracking_carrier von orders werden in die erste Sendung übernommen.

CREATE TABLE IF NOT EXISTS order_shipments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  tracking_number TEXT NOT NULL,
  tracking_carrier TEXT DEFAULT 'DHL',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_shipments_order ON order_shipments(order_id);

ALTER TABLE order_shipments ENABLE ROW LEVEL SECURITY;

-- Kunden sehen nur Sendungen zu eigenen Bestellungen
CREATE POLICY "Users can view own order shipments"
  ON order_shipments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_shipments.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admin sieht alle
CREATE POLICY "Admin can view all order shipments"
  ON order_shipments FOR SELECT
  USING (
    (SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
  );

CREATE POLICY "Admin can insert order shipments"
  ON order_shipments FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
  );

-- Datenmigration: bestehende Sendungsnummern in order_shipments übernehmen (nur wenn noch keine Sendung existiert)
INSERT INTO order_shipments (order_id, tracking_number, tracking_carrier)
SELECT o.id, o.tracking_number, COALESCE(o.tracking_carrier, 'DHL')
FROM orders o
LEFT JOIN order_shipments s ON s.order_id = o.id
WHERE o.tracking_number IS NOT NULL AND o.tracking_number <> '' AND s.id IS NULL;
