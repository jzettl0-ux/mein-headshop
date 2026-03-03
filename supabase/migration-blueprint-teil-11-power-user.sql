-- ============================================
-- Blueprint Teil 11: Brand Protection, Off-Platform Checkout & Deep Analytics
-- 1. Project Zero (Self-Service Takedowns)
-- 2. Voice of the Customer (NCX-Score)
-- 3. Buy With (Off-Platform Checkout)
-- 4. B2B Spend Visibility / Brand Analytics (Search Frequency Rank)
-- ============================================

CREATE SCHEMA IF NOT EXISTS brand_tools;
CREATE SCHEMA IF NOT EXISTS advanced_analytics;
CREATE SCHEMA IF NOT EXISTS external_commerce;

-- =================================================================
-- 1. PROJECT ZERO (SELF-SERVICE TAKEDOWNS)
-- Voraussetzung: security.transparency_brands, vendor_offers
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'security' AND table_name = 'transparency_brands')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'vendor_offers') THEN
    CREATE TABLE IF NOT EXISTS brand_tools.project_zero_takedowns (
        takedown_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_registry_id UUID NOT NULL REFERENCES security.transparency_brands(enrollment_id) ON DELETE CASCADE,
        target_offer_id UUID NOT NULL REFERENCES vendor_offers(id) ON DELETE CASCADE,
        reason_code VARCHAR(50) CHECK (reason_code IN ('COUNTERFEIT', 'TRADEMARK_INFRINGEMENT', 'COPYRIGHT_VIOLATION')),
        action_taken_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        is_appealed BOOLEAN DEFAULT FALSE,
        appeal_successful BOOLEAN DEFAULT NULL,
        admin_reviewed_at TIMESTAMP WITH TIME ZONE
    );
    CREATE TABLE IF NOT EXISTS brand_tools.project_zero_accuracy (
        brand_registry_id UUID PRIMARY KEY REFERENCES security.transparency_brands(enrollment_id) ON DELETE CASCADE,
        total_takedowns INT DEFAULT 0,
        successful_appeals_against_brand INT DEFAULT 0,
        accuracy_score NUMERIC(5,4) GENERATED ALWAYS AS (
            CASE WHEN total_takedowns = 0 THEN 1.0000
            ELSE (total_takedowns - successful_appeals_against_brand)::NUMERIC / total_takedowns END
        ) STORED,
        privilege_suspended BOOLEAN GENERATED ALWAYS AS (
            (total_takedowns > 10) AND ((total_takedowns - successful_appeals_against_brand)::NUMERIC / NULLIF(total_takedowns, 0) < 0.9900)
        ) STORED
    );
  END IF;
END $$;

-- =================================================================
-- 2. VOICE OF THE CUSTOMER (NCX SCORE)
-- =================================================================
CREATE TABLE IF NOT EXISTS advanced_analytics.ncx_scores (
    ncx_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    evaluation_period_days INT DEFAULT 30,
    total_orders INT DEFAULT 0,
    negative_returns INT DEFAULT 0,
    negative_reviews INT DEFAULT 0,
    negative_messages INT DEFAULT 0,
    total_negative_signals INT GENERATED ALWAYS AS (negative_returns + negative_reviews + negative_messages) STORED,
    ncx_rate NUMERIC(5,4) GENERATED ALWAYS AS (
        CASE WHEN total_orders = 0 THEN 0.0000
        ELSE (negative_returns + negative_reviews + negative_messages)::NUMERIC / total_orders END
    ) STORED,
    is_suppressed BOOLEAN GENERATED ALWAYS AS (
        total_orders >= 50 AND ((negative_returns + negative_reviews + negative_messages)::NUMERIC / NULLIF(total_orders, 0) > 0.0800)
    ) STORED,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, vendor_id)
);

CREATE INDEX IF NOT EXISTS idx_analytics_ncx_suppressed ON advanced_analytics.ncx_scores(is_suppressed) WHERE is_suppressed = TRUE;

-- =================================================================
-- 3. BUY WITH (OFF-PLATFORM CHECKOUT)
-- =================================================================
CREATE TABLE IF NOT EXISTS external_commerce.widget_deployments (
    widget_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    domain_whitelist VARCHAR(255) NOT NULL,
    public_api_key VARCHAR(100) UNIQUE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'REVOKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS external_commerce.off_platform_orders (
    external_order_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    widget_id UUID NOT NULL REFERENCES external_commerce.widget_deployments(widget_id) ON DELETE CASCADE,
    internal_order_id UUID UNIQUE NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    external_session_id VARCHAR(255),
    payment_fee_charged NUMERIC(10,2) NOT NULL,
    fulfillment_fee_charged NUMERIC(10,2) NOT NULL,
    processed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 4. SEARCH FREQUENCY RANK (Brand Analytics)
-- =================================================================
CREATE TABLE IF NOT EXISTS advanced_analytics.search_frequency_rank (
    sfr_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    search_term VARCHAR(255) NOT NULL,
    calculation_week DATE NOT NULL,
    platform_rank INT NOT NULL,
    top_product_id_1 UUID REFERENCES products(id) ON DELETE SET NULL,
    click_share_1 NUMERIC(5,4),
    conversion_share_1 NUMERIC(5,4),
    top_product_id_2 UUID REFERENCES products(id) ON DELETE SET NULL,
    click_share_2 NUMERIC(5,4),
    top_product_id_3 UUID REFERENCES products(id) ON DELETE SET NULL,
    click_share_3 NUMERIC(5,4),
    UNIQUE(search_term, calculation_week)
);

CREATE INDEX IF NOT EXISTS idx_analytics_sfr_term ON advanced_analytics.search_frequency_rank(search_term);
