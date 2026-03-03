-- B2B Guided Buying: target_vendor_id für PREFERRED_VENDOR, b2b_account_id für Orders

ALTER TABLE b2b.purchasing_policies
  ADD COLUMN IF NOT EXISTS target_vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_purchasing_policies_vendor ON b2b.purchasing_policies(target_vendor_id) WHERE target_vendor_id IS NOT NULL;

-- Orders: approval_pending für B2B-Genehmigungsflow
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'approval_pending',
    'approval_rejected',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'cancellation_requested',
    'return_requested',
    'return_completed'
  )
);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS b2b_account_id UUID REFERENCES b2b.business_accounts(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_orders_b2b_account ON orders(b2b_account_id) WHERE b2b_account_id IS NOT NULL;
