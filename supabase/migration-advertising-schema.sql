-- Phase 9: PPC & Sponsored Products (Blueprint 8.3)
-- advertising.campaigns, targets, ad_events für GSP-Auktionslogik
-- KCanG: Kein verherrlichendes Cannabis-Targeting (Werbeverbot §6 KCanG)

CREATE SCHEMA IF NOT EXISTS advertising;

-- Werbekampagnen pro Vendor
CREATE TABLE IF NOT EXISTS advertising.campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  daily_budget NUMERIC(10,2) NOT NULL CHECK (daily_budget >= 0),
  bidding_strategy VARCHAR(50) DEFAULT 'FIXED_BIDS' CHECK (bidding_strategy IN ('FIXED_BIDS', 'DYNAMIC_DOWN_ONLY', 'DYNAMIC_UP_AND_DOWN')),
  status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'ARCHIVED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertising_campaigns_vendor ON advertising.campaigns(vendor_id);
CREATE INDEX IF NOT EXISTS idx_advertising_campaigns_status ON advertising.campaigns(status) WHERE status = 'ACTIVE';

COMMENT ON TABLE advertising.campaigns IS 'PPC-Kampagnen. KCanG §6: Kein verherrlichendes Cannabis-Targeting.';

-- Targeting: Keywords oder ASINs/Produkte
CREATE TABLE IF NOT EXISTS advertising.targets (
  target_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id UUID NOT NULL REFERENCES advertising.campaigns(campaign_id) ON DELETE CASCADE,
  target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('KEYWORD', 'ASIN', 'PRODUCT')),
  target_value VARCHAR(255) NOT NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  max_bid_amount NUMERIC(6,2) NOT NULL CHECK (max_bid_amount >= 0),
  match_type VARCHAR(20) DEFAULT 'BROAD' CHECK (match_type IN ('EXACT', 'PHRASE', 'BROAD', 'AUTO')),
  quality_score NUMERIC(5,4) DEFAULT 1.0000,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertising_targets_campaign ON advertising.targets(campaign_id);
CREATE INDEX IF NOT EXISTS idx_advertising_targets_value ON advertising.targets(target_value);

COMMENT ON COLUMN advertising.targets.quality_score IS 'Relevanz × CTR × CVR für Ad-Rank-Berechnung';

-- Ad-Events: Impressions, Clicks, Conversions (für Abrechnung & Metriken)
CREATE TABLE IF NOT EXISTS advertising.ad_events (
  event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_id UUID REFERENCES advertising.targets(target_id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  event_type VARCHAR(20) NOT NULL CHECK (event_type IN ('IMPRESSION', 'CLICK', 'CONVERSION')),
  charged_cpc NUMERIC(6,2) DEFAULT 0,
  session_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_advertising_events_target ON advertising.ad_events(target_id);
CREATE INDEX IF NOT EXISTS idx_advertising_events_product ON advertising.ad_events(product_id);
CREATE INDEX IF NOT EXISTS idx_advertising_events_created ON advertising.ad_events(created_at);

COMMENT ON TABLE advertising.ad_events IS 'Impressions (0€), Clicks (CPC nach GSP), Conversions für Quality Score';

ALTER TABLE advertising.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertising.targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE advertising.ad_events ENABLE ROW LEVEL SECURITY;

-- RLS: Nur Service Role (Admin) und ggf. eigene Vendor-Policies
-- Kein SELECT für öffentliche Nutzer – Kampagnen sind intern
