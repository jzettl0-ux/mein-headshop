-- ============================================
-- Blueprint 3.5: Marketplace Product Guidance (Search Gaps)
-- ============================================

-- analytics Schema aus migration-blueprint-inventory-analytics

CREATE TABLE IF NOT EXISTS analytics.search_term_gaps (
  gap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term VARCHAR(255) NOT NULL,
  search_volume_last_30_days INT DEFAULT 0,
  active_offers_count INT DEFAULT 0,
  opportunity_score NUMERIC GENERATED ALWAYS AS (
    search_volume_last_30_days::NUMERIC / NULLIF(active_offers_count + 1, 0)
  ) STORED,
  last_analyzed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_search_term_gaps_score ON analytics.search_term_gaps(opportunity_score DESC);
CREATE INDEX IF NOT EXISTS idx_search_term_gaps_term ON analytics.search_term_gaps(search_term);

-- Empfehlungen an Vendoren
CREATE TABLE IF NOT EXISTS analytics.vendor_product_recommendations (
  recommendation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  suggested_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  related_search_term VARCHAR(255),
  gap_id UUID REFERENCES analytics.search_term_gaps(gap_id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'SUGGESTED' CHECK (status IN ('SUGGESTED', 'DISMISSED', 'PRODUCT_ADDED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_vendor_recommendations_vendor ON analytics.vendor_product_recommendations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_recommendations_status ON analytics.vendor_product_recommendations(status);

COMMENT ON TABLE analytics.search_term_gaps IS 'Such-Lücken: hohes Volumen, wenig Treffer';
COMMENT ON TABLE analytics.vendor_product_recommendations IS 'Sortiments-Empfehlungen an Vendoren';

ALTER TABLE analytics.search_term_gaps ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics.vendor_product_recommendations ENABLE ROW LEVEL SECURITY;
