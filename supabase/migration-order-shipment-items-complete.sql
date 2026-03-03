-- =============================================================================
-- PAKETINHALT – EINMAL AUSFÜHREN (Supabase SQL Editor)
-- Erstellt Tabelle, RLS, RPC und Rechte. Danach sollte „Inhalt bearbeiten“ funktionieren.
-- =============================================================================

-- 1) Tabelle
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

ALTER TABLE order_shipment_items ENABLE ROW LEVEL SECURITY;

-- 2) Policies (mehrfach ausführbar)
DROP POLICY IF EXISTS "Users can view own order shipment items" ON order_shipment_items;
CREATE POLICY "Users can view own order shipment items"
  ON order_shipment_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_shipments s JOIN orders o ON o.id = s.order_id
      WHERE s.id = order_shipment_items.shipment_id AND o.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admin can view order shipment items" ON order_shipment_items;
CREATE POLICY "Admin can view order shipment items"
  ON order_shipment_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM order_shipments s JOIN orders o ON o.id = s.order_id
      WHERE s.id = order_shipment_items.shipment_id
    )
  );

DROP POLICY IF EXISTS "Allow insert when shipment exists" ON order_shipment_items;
CREATE POLICY "Allow insert when shipment exists"
  ON order_shipment_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM order_shipments s WHERE s.id = order_shipment_items.shipment_id));

DROP POLICY IF EXISTS "Admin can insert order shipment items" ON order_shipment_items;
CREATE POLICY "Admin can insert order shipment items"
  ON order_shipment_items FOR INSERT
  WITH CHECK (
    (SELECT auth.jwt() ->> 'email') IS NOT NULL
    AND EXISTS (SELECT 1 FROM order_shipments s JOIN orders o ON o.id = s.order_id WHERE s.id = order_shipment_items.shipment_id)
  );

DROP POLICY IF EXISTS "Admin can update order shipment items" ON order_shipment_items;
CREATE POLICY "Admin can update order shipment items" ON order_shipment_items FOR UPDATE
  USING ((SELECT auth.jwt() ->> 'email') IS NOT NULL);

DROP POLICY IF EXISTS "Admin can delete order shipment items" ON order_shipment_items;
CREATE POLICY "Admin can delete order shipment items" ON order_shipment_items FOR DELETE
  USING ((SELECT auth.jwt() ->> 'email') IS NOT NULL);

-- 3) RPC (SECURITY DEFINER – schreibt unabhängig von RLS)
DROP FUNCTION IF EXISTS public.save_order_shipment_items(UUID, JSONB);

CREATE OR REPLACE FUNCTION public.save_order_shipment_items(p_shipment_id UUID, p_items JSONB)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  elem JSONB;
  oi_id UUID;
  qty INT;
  result_count INT;
BEGIN
  DELETE FROM order_shipment_items WHERE shipment_id = p_shipment_id;

  IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' AND jsonb_array_length(p_items) > 0 THEN
    FOR elem IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
      BEGIN
        oi_id := (elem->>'order_item_id')::UUID;
        qty   := GREATEST(1, COALESCE((elem->>'quantity')::INT, 1));
      EXCEPTION WHEN OTHERS THEN
        oi_id := NULL;
        qty   := 0;
      END;
      IF oi_id IS NOT NULL AND qty > 0 THEN
        INSERT INTO order_shipment_items (shipment_id, order_item_id, quantity)
        VALUES (p_shipment_id, oi_id, qty)
        ON CONFLICT (shipment_id, order_item_id) DO UPDATE SET quantity = EXCLUDED.quantity;
      END IF;
    END LOOP;
  END IF;

  SELECT count(*)::INT INTO result_count FROM order_shipment_items WHERE shipment_id = p_shipment_id;
  RETURN result_count;
END;
$$;

-- 4) Rechte für service_role (Backend/API)
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.order_shipment_items TO service_role;
GRANT EXECUTE ON FUNCTION public.save_order_shipment_items(UUID, JSONB) TO service_role;
