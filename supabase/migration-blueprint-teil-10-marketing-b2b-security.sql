-- ============================================
-- Blueprint Teil 10: Advanced Marketing, B2B Sales & Platform Security
-- 1. Brand Referral Bonus & Externe Attribution
-- 2. Buyer-Seller Messaging & Anti-Poaching
-- 3. Gefahrgut (Hazmat) Pipeline
-- 4. Dynamic Request for Quote (RFQ)
-- 5. Manage Your Experiments (A/B Testing)
-- ============================================

CREATE SCHEMA IF NOT EXISTS marketing;
CREATE SCHEMA IF NOT EXISTS communications;
CREATE SCHEMA IF NOT EXISTS compliance_hazmat;
CREATE SCHEMA IF NOT EXISTS b2b_negotiation;

-- =================================================================
-- 1. BRAND REFERRAL BONUS & EXTERNE ATTRIBUTION
-- =================================================================
CREATE TABLE IF NOT EXISTS marketing.attribution_campaigns (
    campaign_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    campaign_name VARCHAR(255) NOT NULL,
    tracking_code VARCHAR(100) UNIQUE NOT NULL,
    commission_discount_percentage NUMERIC(5,2) DEFAULT 10.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS marketing.attribution_events (
    event_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    campaign_id UUID NOT NULL REFERENCES marketing.attribution_campaigns(campaign_id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) CHECK (event_type IN ('CLICK', 'ADD_TO_CART', 'PURCHASE')),
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    revenue_generated NUMERIC(10,2) DEFAULT 0.00,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_attribution_code ON marketing.attribution_campaigns(tracking_code);

-- =================================================================
-- 2. BUYER-SELLER MESSAGING & ANTI-POACHING
-- =================================================================
CREATE TABLE IF NOT EXISTS communications.masked_emails (
    mask_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    real_email VARCHAR(255) NOT NULL,
    masked_email VARCHAR(255) UNIQUE NOT NULL,
    entity_type VARCHAR(20) CHECK (entity_type IN ('CUSTOMER', 'VENDOR')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS communications.messages (
    message_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    sender_mask_id UUID NOT NULL REFERENCES communications.masked_emails(mask_id) ON DELETE CASCADE,
    recipient_mask_id UUID NOT NULL REFERENCES communications.masked_emails(mask_id) ON DELETE CASCADE,
    message_body TEXT NOT NULL,
    is_flagged_by_regex BOOLEAN DEFAULT FALSE,
    flag_reason VARCHAR(100) CHECK (flag_reason IN ('CONTAINS_URL', 'CONTAINS_EMAIL', 'CONTAINS_PHONE', 'OFF_PLATFORM_POACHING')),
    delivery_status VARCHAR(20) DEFAULT 'PENDING_REVIEW' CHECK (delivery_status IN ('DELIVERED', 'BLOCKED', 'PENDING_REVIEW')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_messaging_regex ON communications.messages(delivery_status) WHERE is_flagged_by_regex = TRUE;

-- =================================================================
-- 3. GEFAHRGUT (HAZMAT) PIPELINE
-- =================================================================
CREATE TABLE IF NOT EXISTS compliance_hazmat.product_safety_data (
    hazmat_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    contains_batteries BOOLEAN DEFAULT FALSE,
    battery_type VARCHAR(50) CHECK (battery_type IN ('LITHIUM_ION', 'LITHIUM_METAL', 'NONE')),
    is_flammable_liquid BOOLEAN DEFAULT FALSE,
    un_number VARCHAR(10),
    safety_data_sheet_url VARCHAR(500),
    approval_status VARCHAR(50) DEFAULT 'PENDING' CHECK (approval_status IN ('PENDING', 'APPROVED_STANDARD', 'APPROVED_HAZMAT', 'REJECTED')),
    reviewed_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE compliance_hazmat.product_safety_data IS 'Gefahrgut-Compliance: Vaporizer (Akkus), Reinigungsmittel; SDS/Freistellung erforderlich';

-- =================================================================
-- 4. B2B REQUEST FOR QUOTE (RFQ) – nur wenn b2b.business_accounts existiert
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'b2b' AND table_name = 'business_accounts') THEN
    CREATE TABLE IF NOT EXISTS b2b_negotiation.quote_requests (
      quote_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      b2b_customer_id UUID NOT NULL REFERENCES b2b.business_accounts(id) ON DELETE CASCADE,
      product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
      requested_quantity INT NOT NULL CHECK (requested_quantity > 0),
      requested_target_price_total NUMERIC(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'COUNTER_OFFERED', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'PURCHASED')),
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS b2b_negotiation.quote_responses (
      response_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      quote_id UUID NOT NULL REFERENCES b2b_negotiation.quote_requests(quote_id) ON DELETE CASCADE,
      responded_by_vendor BOOLEAN DEFAULT TRUE,
      counter_price_total NUMERIC(10,2) NOT NULL,
      message TEXT,
      checkout_token VARCHAR(64) UNIQUE,
      response_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_b2b_quotes_status ON b2b_negotiation.quote_requests(status) WHERE status IN ('OPEN', 'COUNTER_OFFERED');
  END IF;
END $$;

-- =================================================================
-- 5. MANAGE YOUR EXPERIMENTS (A/B TESTING)
-- =================================================================
CREATE TABLE IF NOT EXISTS marketing.ab_experiments (
    experiment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    experiment_type VARCHAR(50) CHECK (experiment_type IN ('MAIN_IMAGE', 'PRODUCT_TITLE', 'A_PLUS_CONTENT')),
    variant_a_data TEXT NOT NULL,
    variant_b_data TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'RUNNING' CHECK (status IN ('RUNNING', 'COMPLETED', 'CANCELLED')),
    start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    end_date TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS marketing.ab_experiment_metrics (
    metric_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    experiment_id UUID NOT NULL REFERENCES marketing.ab_experiments(experiment_id) ON DELETE CASCADE,
    variant_assigned VARCHAR(1) CHECK (variant_assigned IN ('A', 'B')),
    impressions_count INT DEFAULT 0,
    clicks_count INT DEFAULT 0,
    purchases_count INT DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(experiment_id, variant_assigned)
);
