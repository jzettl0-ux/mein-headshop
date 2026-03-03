-- ============================================
-- Blueprint Teil 12: Margen-Optimierung, Fraud Prevention & Hyper-Targeting
-- 7. Returnless Refunds
-- 8. Vendor Flex Node
-- 9. Buyer Fraud & Concession Abuse Engine
-- 10. B2B Pay by Invoice (API-Factoring)
-- 11. Brand Tailored Promotions
-- ============================================

CREATE SCHEMA IF NOT EXISTS margins;
CREATE SCHEMA IF NOT EXISTS fraud_prevention;
CREATE SCHEMA IF NOT EXISTS b2b_finance;

-- =================================================================
-- 7. RETURNLESS REFUNDS
-- =================================================================
CREATE TABLE IF NOT EXISTS margins.returnless_refund_rules (
    rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
    max_price_threshold NUMERIC(10,2) NOT NULL,
    return_reason_condition VARCHAR(100),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 8. VENDOR FLEX NODE (DEZENTRALES FBA)
-- =================================================================
CREATE TABLE IF NOT EXISTS margins.vendor_flex_nodes (
    node_id VARCHAR(50) PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    physical_address JSONB NOT NULL,
    daily_processing_capacity INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    api_endpoint_url VARCHAR(500),
    registered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 9. BUYER FRAUD & CONCESSION ABUSE ENGINE
-- =================================================================
CREATE TABLE IF NOT EXISTS fraud_prevention.buyer_health_scores (
    customer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_orders_lifetime INT DEFAULT 0,
    total_returns_lifetime INT DEFAULT 0,
    atoz_claims_filed INT DEFAULT 0,
    concession_rate NUMERIC(5,4) GENERATED ALWAYS AS (
        CASE WHEN total_orders_lifetime = 0 THEN 0.0000
        ELSE (total_returns_lifetime + atoz_claims_filed)::NUMERIC / total_orders_lifetime END
    ) STORED,
    requires_signature_on_delivery BOOLEAN GENERATED ALWAYS AS (
        total_orders_lifetime > 5 AND ((total_returns_lifetime + atoz_claims_filed)::NUMERIC / NULLIF(total_orders_lifetime, 0) > 0.3000)
    ) STORED,
    returnless_refunds_blocked BOOLEAN GENERATED ALWAYS AS (
        total_orders_lifetime > 5 AND ((total_returns_lifetime + atoz_claims_filed)::NUMERIC / NULLIF(total_orders_lifetime, 0) > 0.1500)
    ) STORED,
    last_evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_fraud_signature ON fraud_prevention.buyer_health_scores(requires_signature_on_delivery) WHERE requires_signature_on_delivery = TRUE;

-- =================================================================
-- 10. B2B PAY BY INVOICE (API-FACTORING) – nur wenn b2b.business_accounts existiert
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'b2b' AND table_name = 'business_accounts') THEN
    CREATE TABLE IF NOT EXISTS b2b_finance.factoring_agreements (
      agreement_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      b2b_customer_id UUID NOT NULL REFERENCES b2b.business_accounts(id) ON DELETE CASCADE,
      factoring_provider VARCHAR(50) NOT NULL,
      approved_credit_limit NUMERIC(10,2) NOT NULL,
      current_utilized_credit NUMERIC(10,2) DEFAULT 0.00,
      payment_terms_days INT DEFAULT 30,
      status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'DEFAULTED')),
      last_api_sync_at TIMESTAMP WITH TIME ZONE
    );
    CREATE INDEX IF NOT EXISTS idx_b2b_factoring_status ON b2b_finance.factoring_agreements(status);
  END IF;
END $$;

-- =================================================================
-- 11. BRAND TAILORED PROMOTIONS (Schema marketing ggf. aus Phase 9)
-- =================================================================
CREATE SCHEMA IF NOT EXISTS marketing;
CREATE TABLE IF NOT EXISTS marketing.brand_tailored_promotions (
    promo_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    target_audience VARCHAR(50) CHECK (target_audience IN ('CART_ABANDONERS', 'BRAND_FOLLOWERS', 'REPEAT_CUSTOMERS', 'HIGH_SPENDERS')),
    discount_percentage NUMERIC(5,2) NOT NULL,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    redemption_limit INT,
    times_redeemed INT DEFAULT 0
);
