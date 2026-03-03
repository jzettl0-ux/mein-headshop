-- ============================================
-- Blueprint 2.2: Inventory Health & Restock Engine
-- ============================================

CREATE SCHEMA IF NOT EXISTS analytics;

-- Tägliche Bestandsgesundheit (Cronjob)
CREATE TABLE IF NOT EXISTS analytics.inventory_health (
  health_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  offer_id UUID NOT NULL REFERENCES vendor_offers(id) ON DELETE CASCADE,
  avg_daily_sales NUMERIC(8,2) DEFAULT 0.00,
  supplier_lead_time_days INT DEFAULT 14,
  calculated_safety_stock INT DEFAULT 0,
  calculated_reorder_point INT DEFAULT 0,
  current_stock INT DEFAULT 0,
  days_of_supply NUMERIC GENERATED ALWAYS AS (
    CASE WHEN COALESCE(avg_daily_sales, 0) > 0 THEN current_stock / avg_daily_sales ELSE NULL END
  ) STORED,
  needs_restock BOOLEAN DEFAULT FALSE,
  last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(vendor_id, offer_id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_health_vendor ON analytics.inventory_health(vendor_id);
CREATE INDEX IF NOT EXISTS idx_inventory_health_needs_restock ON analytics.inventory_health(needs_restock) WHERE needs_restock = TRUE;

COMMENT ON TABLE analytics.inventory_health IS 'ROP/Safety Stock; Cronjob berechnet avg_daily_sales und needs_restock';

ALTER TABLE analytics.inventory_health ENABLE ROW LEVEL SECURITY;
