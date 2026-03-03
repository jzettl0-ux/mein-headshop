-- INSERT für order_shipment_items erlauben, wenn die Sendung existiert (für Backend/Service-Role).
-- So kann der Paketinhalt auch ohne JWT (z. B. Service-Role) gespeichert werden.
-- Mehrere INSERT-Policies werden mit OR verknüpft.

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

-- Zusätzliche Policy: INSERT erlauben, wenn shipment_id zu order_shipments gehört (für Service-Role/Backend).
DROP POLICY IF EXISTS "Allow insert when shipment exists" ON order_shipment_items;
CREATE POLICY "Allow insert when shipment exists"
  ON order_shipment_items FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM order_shipments s WHERE s.id = order_shipment_items.shipment_id)
  );
