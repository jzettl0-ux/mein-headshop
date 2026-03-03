-- ============================================
-- Blueprint 2.4: Multi-Channel Fulfillment (MCF/FBN)
-- ============================================

CREATE SCHEMA IF NOT EXISTS logistics;

CREATE TABLE IF NOT EXISTS logistics.mcf_orders (
  mcf_order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  external_order_reference VARCHAR(255) NOT NULL,
  shipping_speed VARCHAR(50) DEFAULT 'STANDARD' CHECK (shipping_speed IN ('STANDARD', 'EXPEDITED', 'PRIORITY')),
  shipping_address JSONB NOT NULL,
  status VARCHAR(50) DEFAULT 'RECEIVED' CHECK (status IN ('RECEIVED', 'PLANNING', 'SHIPPED', 'DELIVERED', 'UNFULFILLABLE')),
  fulfillment_fee_charged NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_mcf_orders_vendor ON logistics.mcf_orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_mcf_orders_status ON logistics.mcf_orders(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_mcf_orders_external ON logistics.mcf_orders(vendor_id, external_order_reference);

COMMENT ON TABLE logistics.mcf_orders IS 'Externe Bestellungen (Shopify/WooCommerce) für FBN-Versand';

ALTER TABLE logistics.mcf_orders ENABLE ROW LEVEL SECURITY;
