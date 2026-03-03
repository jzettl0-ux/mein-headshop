-- Explizite Rechte für Paketinhalt: Service-Role muss schreiben und lesen können.
-- Nach migration-order-shipment-items.sql ausführen.

GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.order_shipment_items TO service_role;

-- Falls RPC verwendet wird:
GRANT EXECUTE ON FUNCTION public.save_order_shipment_items(UUID, JSONB) TO service_role;
