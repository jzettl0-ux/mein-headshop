-- ============================================
-- Blueprint Supplement: Fehlende Punkte aus deinem Blueprint-Text
-- Nach migration-blueprint-teil-10, -11, -12 ausführen
-- ============================================
-- 1. Strike-System (3 Strikes → Suspendierung)
-- 2. Messaging-SLA (24h CRT, fließt in Buy Box)
-- 3. RFQ Checkout-Token 48h Gültigkeit
-- 4. Brand Tailored Promotions: generated is_active
-- 5. Buyer Fraud: OTP-Friction (requires_otp_on_delivery)
-- ============================================

-- =================================================================
-- 1. AUTO-STRIKE-SYSTEM (Teil 10: Messaging Anti-Poaching)
-- 3 Strikes → Suspendierung des Messaging-Rechts
-- =================================================================
CREATE TABLE IF NOT EXISTS communications.strike_log (
    strike_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    message_id UUID REFERENCES communications.messages(message_id) ON DELETE SET NULL,
    strike_reason VARCHAR(100) NOT NULL CHECK (strike_reason IN ('REGEX_VIOLATION', 'OFF_PLATFORM_POACHING', 'MANUAL_ADMIN')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_strike_vendor ON communications.strike_log(vendor_id);

-- View: Vendoren mit 3+ Strikes (suspendiert)
CREATE OR REPLACE VIEW communications.vendors_messaging_suspended AS
SELECT vendor_id, COUNT(*) AS strike_count
FROM communications.strike_log
GROUP BY vendor_id
HAVING COUNT(*) >= 3;

COMMENT ON TABLE communications.strike_log IS 'Blueprint: 3 Strikes → Messaging-Suspendierung bei Anti-Poaching-Verstößen';

-- =================================================================
-- 2. MESSAGING-SLA (24h CRT, fließt in Buy Box)
-- Contact Response Time: erste Antwort innerhalb 24h
-- =================================================================
CREATE TABLE IF NOT EXISTS communications.vendor_messaging_sla (
    vendor_id UUID PRIMARY KEY REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    messages_total INT DEFAULT 0,
    messages_answered_within_24h INT DEFAULT 0,
    avg_first_response_hours NUMERIC(5,2),
    last_calculated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE communications.vendor_messaging_sla IS 'Blueprint: 24h CRT für Messaging, fließt in Buy-Box-Scoring (vendor_performance_metrics.response_time_avg_hours)';

-- =================================================================
-- 3. RFQ CHECKOUT-TOKEN 48h GÜLTIGKEIT (Teil 10)
-- Temporary Checkout Token (48 h gültig)
-- =================================================================
ALTER TABLE b2b_negotiation.quote_responses
  ADD COLUMN IF NOT EXISTS checkout_token_expires_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN b2b_negotiation.quote_responses.checkout_token_expires_at IS 'Blueprint: Token 48h gültig; bei Erstellung = response_timestamp + 48h setzen';

-- =================================================================
-- 4. BRAND TAILORED PROMOTIONS: generated is_active (Teil 12)
-- =================================================================
ALTER TABLE marketing.brand_tailored_promotions
  ADD COLUMN IF NOT EXISTS is_active_computed BOOLEAN GENERATED ALWAYS AS (
    CURRENT_TIMESTAMP BETWEEN valid_from AND valid_until
    AND (redemption_limit IS NULL OR times_redeemed < redemption_limit)
  ) STORED;

COMMENT ON COLUMN marketing.brand_tailored_promotions.is_active_computed IS 'Blueprint: Automatisch FALSE wenn außerhalb Gültigkeit oder Limit erreicht';

-- =================================================================
-- 5. BUYER FRAUD: OTP-FRICTION (Teil 12)
-- „Friction (keine kostenlosen Retouren, OTP)“
-- =================================================================
ALTER TABLE fraud_prevention.buyer_health_scores
  ADD COLUMN IF NOT EXISTS requires_otp_on_delivery BOOLEAN GENERATED ALWAYS AS (
    total_orders_lifetime > 10
    AND ((total_returns_lifetime + atoz_claims_filed)::NUMERIC / NULLIF(total_orders_lifetime, 0) > 0.2500)
  ) STORED;

COMMENT ON COLUMN fraud_prevention.buyer_health_scores.requires_otp_on_delivery IS 'Blueprint: Bei hoher Concession-Rate OTP bei Zustellung verlangen';
