-- RPC zum zuverlässigen Speichern des Paketinhalts (umgeht RLS durch SECURITY DEFINER).
-- In Supabase SQL Editor ausführen, damit „Inhalt bearbeiten“ dauerhaft speichert.
-- Verwendung: API ruft save_order_shipment_items(p_shipment_id, p_items) auf.

-- Bei Änderung des Rückgabetyps (z. B. void → integer) zuerst bestehende Funktion entfernen:
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
  -- Bestehende Zuordnungen für diese Sendung löschen
  DELETE FROM order_shipment_items
  WHERE shipment_id = p_shipment_id;

  -- Neue Zeilen einfügen (p_items = [{ "order_item_id": "...", "quantity": 1 }, ...])
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

COMMENT ON FUNCTION public.save_order_shipment_items(UUID, JSONB) IS
  'Setzt den Inhalt einer Sendung (order_shipment_items). Gibt die Anzahl gespeicherter Zeilen zurück. SECURITY DEFINER.';

-- API (service_role) muss die Funktion aufrufen können
GRANT EXECUTE ON FUNCTION public.save_order_shipment_items(UUID, JSONB) TO service_role;
