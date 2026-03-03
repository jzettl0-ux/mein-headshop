-- Reduziert den Lagerbestand aller Produkte einer Bestellung (wird bei Zahlungseingang aufgerufen).
-- Nur per Service-Role/Admin aufrufen.
CREATE OR REPLACE FUNCTION decrement_stock_for_order(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products p
  SET stock = GREATEST(0, p.stock - oi.quantity)
  FROM order_items oi
  WHERE oi.order_id = p_order_id
    AND p.id = oi.product_id;
END;
$$;
