-- Bestand bei Storno (noch nicht versandt) wiederherstellen.
-- Wird aufgerufen, wenn eine bezahlte Bestellung auf "storniert" gesetzt wird.
CREATE OR REPLACE FUNCTION increment_stock_for_order(p_order_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE products p
  SET stock = p.stock + oi.quantity
  FROM order_items oi
  WHERE oi.order_id = p_order_id
    AND p.id = oi.product_id;
END;
$$;

COMMENT ON FUNCTION increment_stock_for_order(UUID) IS 'Fügt die bestellten Mengen wieder dem Lagerbestand hinzu (z. B. bei Storno vor Versand).';
