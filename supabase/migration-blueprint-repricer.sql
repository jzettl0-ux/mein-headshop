-- ============================================
-- Blueprint 2.3: Automatisierte Preisanpassung (Repricer)
-- ============================================

CREATE SCHEMA IF NOT EXISTS pricing;

CREATE TABLE IF NOT EXISTS pricing.automated_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id UUID UNIQUE NOT NULL REFERENCES vendor_offers(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT FALSE,
  min_price NUMERIC(10,2) NOT NULL,
  max_price NUMERIC(10,2) NOT NULL,
  rule_type VARCHAR(50) CHECK (rule_type IN ('MATCH_BUY_BOX', 'STAY_BELOW_BUY_BOX', 'MATCH_LOWEST_PRICE')),
  price_offset NUMERIC(10,2) DEFAULT 0.00,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_automated_rules_vendor ON pricing.automated_rules(vendor_id);
CREATE INDEX IF NOT EXISTS idx_automated_rules_active ON pricing.automated_rules(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE pricing.automated_rules IS 'Repricer: Min/Max, Buy Box Logik, Schutz vor Race-to-the-Bottom';

ALTER TABLE pricing.automated_rules ENABLE ROW LEVEL SECURITY;
