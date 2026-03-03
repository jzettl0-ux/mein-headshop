-- ============================================
-- Blueprint Teil 17: Legal Automation, Post-Purchase & Vendor Programs
-- PAngV, Geo-Restrictions, CSBA, Launchpad, Market Basket Analysis
-- ============================================

CREATE SCHEMA IF NOT EXISTS legal_compliance;
CREATE SCHEMA IF NOT EXISTS vendor_programs;

-- =================================================================
-- 1. PANGV GRUNDPREIS-ENGINE & BULK-UPSELLING
-- =================================================================
CREATE TABLE IF NOT EXISTS legal_compliance.base_pricing_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    net_content_value NUMERIC(10,2) NOT NULL,
    net_content_unit VARCHAR(20) NOT NULL,
    reference_value NUMERIC(10,2) NOT NULL,
    base_price_multiplier NUMERIC(10,4) GENERATED ALWAYS AS (reference_value / NULLIF(net_content_value, 0)) STORED,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_base_pricing_rules_product ON legal_compliance.base_pricing_rules(product_id);

-- =================================================================
-- 2. GEOGRAFISCHER COMPLIANCE-BLOCKER
-- =================================================================
CREATE TABLE IF NOT EXISTS legal_compliance.geo_restrictions (
    restriction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    entity_type VARCHAR(50) CHECK (entity_type IN ('PRODUCT', 'CATEGORY')),
    entity_id UUID NOT NULL,
    blocked_country_code VARCHAR(2) NOT NULL,
    blocked_zip_codes JSONB,
    reason_code VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_geo_restrictions_entity ON legal_compliance.geo_restrictions(entity_id, blocked_country_code);
CREATE INDEX IF NOT EXISTS idx_geo_restrictions_country ON legal_compliance.geo_restrictions(blocked_country_code);

-- =================================================================
-- 3. CUSTOMER SERVICE BY ADMIN (CSBA)
-- =================================================================
CREATE TABLE IF NOT EXISTS vendor_programs.csba_subscriptions (
    subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID UNIQUE NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    fee_per_order NUMERIC(5,2) NOT NULL DEFAULT 0.50,
    is_active BOOLEAN DEFAULT TRUE,
    auto_escalation_enabled BOOLEAN DEFAULT TRUE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_csba_active ON vendor_programs.csba_subscriptions(vendor_id) WHERE is_active = TRUE;

-- =================================================================
-- 4. DAS "LAUNCHPAD" ACCELERATOR-PROGRAMM
-- =================================================================
CREATE TABLE IF NOT EXISTS vendor_programs.launchpad_enrollments (
    enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    program_start_date DATE NOT NULL,
    program_end_date DATE GENERATED ALWAYS AS (program_start_date + INTERVAL '90 days') STORED,
    exclusive_until DATE,
    search_boost_multiplier NUMERIC(4,2) DEFAULT 1.50,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'COMPLETED', 'REVOKED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_launchpad_active ON vendor_programs.launchpad_enrollments(status) WHERE status = 'ACTIVE';

-- =================================================================
-- 5. MARKET BASKET ANALYSIS (Share of Wallet)
-- =================================================================
CREATE SCHEMA IF NOT EXISTS advanced_analytics;

CREATE TABLE IF NOT EXISTS advanced_analytics.market_basket_correlations (
    correlation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    anchor_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    associated_category TEXT,
    associated_brand_name VARCHAR(255),
    correlation_percentage NUMERIC(5,2) NOT NULL,
    analyzed_timeframe_days INT DEFAULT 30,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_market_basket_anchor ON advanced_analytics.market_basket_correlations(anchor_product_id);
