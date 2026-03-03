-- ============================================
-- Blueprint 3.4: SAFE-T Claims (Verkäufer-Schutz)
-- ============================================

CREATE SCHEMA IF NOT EXISTS seller_services;

CREATE TABLE IF NOT EXISTS seller_services.safet_claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  order_line_id UUID REFERENCES fulfillment.order_lines(id) ON DELETE SET NULL,
  claim_reason VARCHAR(100) CHECK (claim_reason IN (
    'RETURNED_EMPTY_BOX', 'RETURNED_MATERIALLY_DIFFERENT', 'RETURNED_DAMAGED', 'NEVER_RECEIVED_RETURN'
  )),
  requested_amount NUMERIC(10,2) NOT NULL,
  granted_amount NUMERIC(10,2) DEFAULT 0.00,
  evidence_urls JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'UNDER_INVESTIGATION' CHECK (status IN (
    'UNDER_INVESTIGATION', 'AWAITING_SELLER_INFO', 'GRANTED', 'DENIED'
  )),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_safet_claims_vendor ON seller_services.safet_claims(vendor_id);
CREATE INDEX IF NOT EXISTS idx_safet_claims_status ON seller_services.safet_claims(status);

COMMENT ON TABLE seller_services.safet_claims IS 'Händler-Schutz bei Retouren-Betrug; Payout aus Plattform-Risikofonds';

ALTER TABLE seller_services.safet_claims ENABLE ROW LEVEL SECURITY;
