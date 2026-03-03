-- Phase 8: Customer Experience Schema (Blueprint 10.5)
-- cx.subscriptions: Subscribe & Save (Spar-Abos)
-- cx.a_to_z_claims: A-bis-z-Garantie (Eskalations-Workflow)

CREATE SCHEMA IF NOT EXISTS cx;

-- Subscribe & Save (Spar-Abos)
CREATE TABLE IF NOT EXISTS cx.subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1,
  interval_days INT NOT NULL CHECK (interval_days >= 14),
  discount_percentage NUMERIC(5,2) DEFAULT 5.00,
  next_order_date DATE NOT NULL,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CANCELLED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cx_subscriptions_customer ON cx.subscriptions(customer_id);
CREATE INDEX IF NOT EXISTS idx_cx_subscriptions_next ON cx.subscriptions(next_order_date) WHERE status = 'ACTIVE';

COMMENT ON TABLE cx.subscriptions IS 'Subscribe & Save: Spar-Abos mit Rabatt. Cron generiert Bestellungen.';

-- A-bis-z-Garantie (Käuferschutz, Eskalations-Workflow)
CREATE TABLE IF NOT EXISTS cx.a_to_z_claims (
  claim_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  claim_reason TEXT CHECK (claim_reason IN ('ITEM_NOT_RECEIVED', 'MATERIALLY_DIFFERENT', 'REFUND_NOT_ISSUED', 'OTHER')),
  status TEXT DEFAULT 'UNDER_REVIEW' CHECK (status IN ('UNDER_REVIEW', 'WAITING_ON_SELLER', 'GRANTED', 'DENIED', 'WITHDRAWN')),
  claim_amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  opened_at TIMESTAMPTZ DEFAULT now(),
  resolved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_cx_claims_order ON cx.a_to_z_claims(order_id);
CREATE INDEX IF NOT EXISTS idx_cx_claims_customer ON cx.a_to_z_claims(customer_id);
CREATE INDEX IF NOT EXISTS idx_cx_claims_status ON cx.a_to_z_claims(status);

COMMENT ON TABLE cx.a_to_z_claims IS 'A-bis-z-Garantie: Eskalation bei nicht geliefert, abweichend, Erstattung verweigert.';

ALTER TABLE cx.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE cx.a_to_z_claims ENABLE ROW LEVEL SECURITY;
