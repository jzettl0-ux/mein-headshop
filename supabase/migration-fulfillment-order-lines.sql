-- ============================================
-- Phase 3.1: Order Splitting & Multi-Vendor – fulfillment.order_lines
-- ============================================
-- Order Lines gruppieren Bestellpositionen pro Vendor für Fulfillment.
-- order_items erhält vendor_id, offer_id, fulfillment_type, seller_type.

-- Schema fulfillment (falls nicht vorhanden)
CREATE SCHEMA IF NOT EXISTS fulfillment;

-- order_items: Vendor/Offer-Zuordnung (nullable für Rückwärtskompatibilität)
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES vendor_offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS fulfillment_type TEXT DEFAULT 'fbm' CHECK (fulfillment_type IN ('fbm', 'fba')),
  ADD COLUMN IF NOT EXISTS seller_type TEXT DEFAULT 'shop' CHECK (seller_type IN ('shop', 'vendor'));

COMMENT ON COLUMN order_items.vendor_id IS 'Vendor bei vendor-Angebot; NULL = Shop';
COMMENT ON COLUMN order_items.offer_id IS 'vendor_offers.id bei vendor-Angebot; NULL = Shop';
COMMENT ON COLUMN order_items.fulfillment_type IS 'fbm = Vendor versendet, fba = FBA (später)';
COMMENT ON COLUMN order_items.seller_type IS 'shop = eigener Shop, vendor = Drittanbieter';

-- fulfillment.order_lines: Eine Zeile pro Vendor pro Bestellung
CREATE TABLE IF NOT EXISTS fulfillment.order_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  seller_type TEXT NOT NULL DEFAULT 'shop' CHECK (seller_type IN ('shop', 'vendor')),
  fulfillment_type TEXT NOT NULL DEFAULT 'fbm' CHECK (fulfillment_type IN ('fbm', 'fba')),
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_portion DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_lines_order ON fulfillment.order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_vendor ON fulfillment.order_lines(vendor_id);

COMMENT ON TABLE fulfillment.order_lines IS 'Order Lines pro Vendor für Multi-Vendor-Fulfillment (Blueprint 6.3)';

-- order_items: Verknüpfung mit order_line
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS order_line_id UUID REFERENCES fulfillment.order_lines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_order_items_order_line ON order_items(order_line_id);
CREATE INDEX IF NOT EXISTS idx_order_items_vendor ON order_items(vendor_id) WHERE vendor_id IS NOT NULL;

-- updated_at Trigger für order_lines
CREATE OR REPLACE FUNCTION fulfillment.update_order_lines_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_order_lines_updated_at ON fulfillment.order_lines;
CREATE TRIGGER trigger_order_lines_updated_at
  BEFORE UPDATE ON fulfillment.order_lines
  FOR EACH ROW
  EXECUTE FUNCTION fulfillment.update_order_lines_updated_at();
