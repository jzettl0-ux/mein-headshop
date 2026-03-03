-- Einmalig im Supabase SQL Editor ausführen, damit Paketinhalt (Sendung ↔ Artikel) dauerhaft gespeichert wird.
-- Enthält: RPC-Funktion (SECURITY DEFINER) + Rechte für service_role.
-- Vorher müssen migration-order-shipment-items.sql (Tabelle) und ggf. migration-order-shipment-items-allow-insert.sql laufen.

-- 1) RPC – Schreiben umgeht RLS zuverlässig
DROP FUNCTION IF EXISTS public.save_order_shipment_items(UUID, JSONB);

CREATE OR REPLACE FUNCTION public.save_order_shipment_items(
  p_shipment_id UUID,
  p_items JSONB
)
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

  SELECT count(*)::INT INTO result_count
  FROM order_shipment_items
  WHERE shipment_id = p_shipment_id;
  RETURN result_count;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_order_shipment_items(UUID, JSONB) TO service_role;

-- 2) Rechte – Service-Role muss Tabelle lesen/schreiben können
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.order_shipment_items TO service_role;
