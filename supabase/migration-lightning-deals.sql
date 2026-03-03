-- Phase 10.1: Lightning Deals (4:20 Deals)
-- Zeitlich begrenzt, Kontingent, Countdown

CREATE SCHEMA IF NOT EXISTS promotions;

CREATE TABLE IF NOT EXISTS promotions.lightning_deals (
  deal_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  deal_price NUMERIC(10,2) NOT NULL CHECK (deal_price >= 0),
  original_price NUMERIC(10,2) NOT NULL CHECK (original_price >= 0),
  quantity_total INT NOT NULL CHECK (quantity_total > 0),
  quantity_claimed INT NOT NULL DEFAULT 0 CHECK (quantity_claimed >= 0),
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'ended', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_lightning_deals_product ON promotions.lightning_deals(product_id);
CREATE INDEX IF NOT EXISTS idx_lightning_deals_times ON promotions.lightning_deals(start_at, end_at) WHERE status IN ('scheduled', 'active');

COMMENT ON TABLE promotions.lightning_deals IS 'Zeitlich begrenzte Angebote (4:20 Deals) mit Kontingent und Countdown';

ALTER TABLE promotions.lightning_deals ENABLE ROW LEVEL SECURITY;
