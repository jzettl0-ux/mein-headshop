-- ============================================
-- Click Share: Rohdaten für Search Frequency Rank
-- Wird von POST /api/analytics/record-search-click befüllt,
-- Cron refresh-search-frequency-rank aggregiert in search_frequency_rank.
-- ============================================

CREATE TABLE IF NOT EXISTS advanced_analytics.search_clicks (
  click_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_term VARCHAR(255) NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  session_id VARCHAR(255) NOT NULL,
  clicked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_search_clicks_term_at ON advanced_analytics.search_clicks(search_term, clicked_at);
CREATE INDEX IF NOT EXISTS idx_search_clicks_product ON advanced_analytics.search_clicks(product_id);

COMMENT ON TABLE advanced_analytics.search_clicks IS 'Rohklicks pro Suchbegriff+Produkt für Click-Share-Aggregation (Brand Analytics)';

ALTER TABLE advanced_analytics.search_clicks ENABLE ROW LEVEL SECURITY;
