-- ============================================
-- Blueprint Teil 19: Enterprise B2B, Profit-Schutz & Deep-Tech Logistik
-- B2B PunchOut, CRAP-Algorithmus, FEFO, Creator Economy, Anti-Hijacking, OSS
-- ============================================

CREATE SCHEMA IF NOT EXISTS enterprise_b2b;
CREATE SCHEMA IF NOT EXISTS financial_defense;
CREATE SCHEMA IF NOT EXISTS wms_fefo;
CREATE SCHEMA IF NOT EXISTS creator_economy;

-- =================================================================
-- 1. B2B PUNCHOUT CATALOG INTEGRATION (eProcurement)
-- SAP Ariba, Coupa – Warenkorb-Rückflug in ERP
-- =================================================================
CREATE TABLE IF NOT EXISTS enterprise_b2b.punchout_sessions (
    session_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    b2b_account_id UUID NOT NULL REFERENCES b2b.business_accounts(id) ON DELETE CASCADE,
    procurement_system VARCHAR(100) NOT NULL,
    buyer_cookie VARCHAR(255) NOT NULL,
    setup_request_xml TEXT,
    return_url VARCHAR(500) NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'RETURNED_CART', 'EXPIRED')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_punchout_b2b ON enterprise_b2b.punchout_sessions(b2b_account_id);
CREATE INDEX IF NOT EXISTS idx_punchout_status ON enterprise_b2b.punchout_sessions(status);

-- =================================================================
-- 2. CRAP ALGORITHM (PROFIT-WÄCHTER)
-- Net PPM < 0% → SUPPRESSED oder Add-on Item
-- =================================================================
CREATE TABLE IF NOT EXISTS financial_defense.crap_metrics (
    crap_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID,
    asin VARCHAR(20),
    calculated_net_ppm NUMERIC(8,4) NOT NULL,
    action_taken VARCHAR(50) DEFAULT 'NONE' CHECK (action_taken IN ('NONE', 'CONVERTED_TO_ADD_ON', 'SUPPRESSED')),
    last_evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_crap_product ON financial_defense.crap_metrics(product_id);
CREATE INDEX IF NOT EXISTS idx_crap_action ON financial_defense.crap_metrics(action_taken) WHERE action_taken != 'NONE';

-- =================================================================
-- 3. LOT-TRACKING & FEFO LOGISTIK (Mindesthaltbarkeit)
-- First Expire, First Out für CBD, Samen, Dünger
-- =================================================================
CREATE TABLE IF NOT EXISTS wms_fefo.inventory_lots (
    lot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID,
    manufacturer_batch_number VARCHAR(100) NOT NULL,
    expiration_date DATE NOT NULL,
    quantity_available INT NOT NULL,
    warehouse_bin_location VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'SELLABLE' CHECK (status IN ('SELLABLE', 'EXPIRED', 'QUARANTINE')),
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_wms_fefo_expiry ON wms_fefo.inventory_lots(product_id, expiration_date) WHERE status = 'SELLABLE';
CREATE INDEX IF NOT EXISTS idx_wms_fefo_bin ON wms_fefo.inventory_lots(warehouse_bin_location);

-- =================================================================
-- 4. CREATOR ECONOMY & INFLUENCER STOREFRONTS
-- Vanity-URL, Ideenlisten, Ledger Split
-- =================================================================
CREATE TABLE IF NOT EXISTS creator_economy.influencer_profiles (
    creator_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL,
    user_account_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    vanity_url_slug VARCHAR(100) UNIQUE NOT NULL,
    social_handle VARCHAR(255),
    custom_commission_rate NUMERIC(5,2) DEFAULT 4.00,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'PENDING')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS creator_economy.storefront_idea_lists (
    list_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES creator_economy.influencer_profiles(creator_id) ON DELETE CASCADE,
    list_title VARCHAR(255) NOT NULL,
    product_ids JSONB NOT NULL DEFAULT '[]',
    asins_included JSONB NOT NULL DEFAULT '[]',
    is_published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_creator_slug ON creator_economy.influencer_profiles(vanity_url_slug);
CREATE INDEX IF NOT EXISTS idx_idea_lists_creator ON creator_economy.storefront_idea_lists(creator_id);

-- =================================================================
-- 5. ANTI-HIJACKING & SALES VELOCITY DEFENSE
-- Preis-Drop >70%, Velocity-Spike >500% → ACCOUNT_FROZEN
-- =================================================================
CREATE TABLE IF NOT EXISTS financial_defense.velocity_anomalies (
    anomaly_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    anomaly_type VARCHAR(50) CHECK (anomaly_type IN ('PRICE_DROP_EXTREME', 'SALES_VELOCITY_SPIKE')),
    trigger_value NUMERIC(12,2) NOT NULL,
    action_taken VARCHAR(50) DEFAULT 'ACCOUNT_FROZEN',
    requires_2fa_unlock BOOLEAN DEFAULT true,
    resolved_at TIMESTAMP WITH TIME ZONE,
    detected_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_velocity_vendor ON financial_defense.velocity_anomalies(vendor_id);
CREATE INDEX IF NOT EXISTS idx_velocity_unresolved ON financial_defense.velocity_anomalies(vendor_id) WHERE resolved_at IS NULL;

-- =================================================================
-- 6. CROSS-BORDER TAX & OSS THRESHOLD MONITOR
-- 10.000 € EU-Schwelle, 8.000 € Warnung
-- =================================================================
CREATE TABLE IF NOT EXISTS financial_defense.oss_threshold_monitor (
    monitor_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL,
    target_country_code VARCHAR(2) NOT NULL,
    ttm_cross_border_revenue NUMERIC(12,2) DEFAULT 0.00,
    legal_threshold NUMERIC(12,2) DEFAULT 10000.00,
    oss_registration_provided BOOLEAN DEFAULT false,
    oss_tax_number VARCHAR(50),
    warning_sent_at TIMESTAMP WITH TIME ZONE,
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(vendor_id, target_country_code)
);

CREATE INDEX IF NOT EXISTS idx_tax_oss_blocked ON financial_defense.oss_threshold_monitor(vendor_id)
    WHERE ttm_cross_border_revenue >= legal_threshold AND oss_registration_provided = false;

-- Add-on Item Flag für CRAP (Produkte nur ab Mindestbestellwert)
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_add_on_item BOOLEAN DEFAULT false;
ALTER TABLE products ADD COLUMN IF NOT EXISTS add_on_min_order_value NUMERIC(10,2) DEFAULT 20.00;

COMMENT ON SCHEMA enterprise_b2b IS 'B2B PunchOut / cXML / OData (SAP Ariba, Coupa)';
COMMENT ON SCHEMA financial_defense IS 'CRAP, Velocity, OSS – Profit-Schutz & Tax';
COMMENT ON SCHEMA wms_fefo IS 'Lot-Tracking, FEFO für verderbliche Ware';
COMMENT ON SCHEMA creator_economy IS 'Influencer Storefronts, Ideenlisten, Ledger Split';
