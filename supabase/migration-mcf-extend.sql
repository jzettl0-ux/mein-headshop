-- MCF: Optionale Items (JSONB) für externe Bestellpositionen

ALTER TABLE logistics.mcf_orders
  ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]';

ALTER TABLE logistics.mcf_orders
  ADD COLUMN IF NOT EXISTS tracking_number TEXT;

ALTER TABLE logistics.mcf_orders
  ADD COLUMN IF NOT EXISTS tracking_carrier TEXT;

COMMENT ON COLUMN logistics.mcf_orders.items IS 'Bestellpositionen: [{ sku, product_id?, quantity, unit_price }]';
