-- ============================================
-- Phase 3.3: Mollie Split Payments – Vendor-Anbindung
-- ============================================
-- vendor_accounts: Mollie Organization ID für Split-Routing
-- order_payment_splits: Protokoll der Aufteilung pro Zahlung (für Refunds/Chargebacks)

CREATE SCHEMA IF NOT EXISTS financials;

ALTER TABLE vendor_accounts
  ADD COLUMN IF NOT EXISTS mollie_organization_id TEXT;

COMMENT ON COLUMN vendor_accounts.mollie_organization_id IS 'Mollie Connect Organization ID (org_xxx) für Split-Payments; Vendoren müssen mit der Plattform verbunden sein.';

CREATE TABLE IF NOT EXISTS financials.order_payment_splits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  mollie_payment_id TEXT NOT NULL,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  seller_type TEXT NOT NULL DEFAULT 'vendor' CHECK (seller_type IN ('shop', 'vendor')),
  amount_eur DECIMAL(10,2) NOT NULL,
  commission_eur DECIMAL(10,2) DEFAULT 0,
  mollie_route_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_order_payment_splits_order ON financials.order_payment_splits(order_id);
CREATE INDEX IF NOT EXISTS idx_order_payment_splits_vendor ON financials.order_payment_splits(vendor_id);
COMMENT ON TABLE financials.order_payment_splits IS 'Aufteilung der Zahlung pro Vendor für Mollie Split; Basis für Refund-Reverse-Routing.';
