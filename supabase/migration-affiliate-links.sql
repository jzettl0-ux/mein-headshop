-- Phase 11.5: Affiliate/PartnerNet
-- advanced_ops.affiliate_links: Tracking-Links, Cookie-Laufzeit, Provision

CREATE SCHEMA IF NOT EXISTS advanced_ops;

CREATE TABLE IF NOT EXISTS advanced_ops.affiliate_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  partner_name TEXT NOT NULL,
  partner_email TEXT,
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00 CHECK (commission_percent >= 0 AND commission_percent <= 100),
  cookie_days INTEGER NOT NULL DEFAULT 30 CHECK (cookie_days >= 1 AND cookie_days <= 365),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_affiliate_links_code ON advanced_ops.affiliate_links(code);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_active ON advanced_ops.affiliate_links(is_active) WHERE is_active = true;

CREATE TABLE IF NOT EXISTS advanced_ops.affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES advanced_ops.affiliate_links(id) ON DELETE CASCADE,
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  order_total DECIMAL(10,2) NOT NULL,
  commission_eur DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  paid_at TIMESTAMPTZ,
  UNIQUE(order_id)
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON advanced_ops.affiliate_commissions(affiliate_link_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON advanced_ops.affiliate_commissions(status);

COMMENT ON TABLE advanced_ops.affiliate_links IS 'Phase 11.5: Affiliate-Partner, Tracking-Links (?aff=CODE), Provision';
COMMENT ON TABLE advanced_ops.affiliate_commissions IS 'Provisionen pro Bestellung – bei Zahlungseingang erstellt';

ALTER TABLE advanced_ops.affiliate_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE advanced_ops.affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Bestellung: optionaler Affiliate-Code
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
