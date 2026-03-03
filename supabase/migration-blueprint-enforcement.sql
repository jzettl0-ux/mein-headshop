-- ============================================
-- Blueprint Teil 6: Enforcement – RFS, ASIN Locks
-- ============================================
-- Läuft auch ohne fulfillment.returns: return_inspections_ext wird nur angelegt,
-- wenn fulfillment.returns existiert; asin_locks immer.

CREATE SCHEMA IF NOT EXISTS enforcement;

-- return_inspections_ext nur anlegen, wenn fulfillment.returns existiert (sonst FK-Fehler)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'fulfillment' AND table_name = 'returns'
  ) THEN
    CREATE TABLE IF NOT EXISTS enforcement.return_inspections_ext (
      inspection_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      return_id UUID REFERENCES fulfillment.returns(id) ON DELETE CASCADE,
      order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
      vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
      is_hygiene_product BOOLEAN DEFAULT FALSE,
      rfs_blocked BOOLEAN GENERATED ALWAYS AS (is_hygiene_product = TRUE) STORED,
      inspection_deadline TIMESTAMPTZ NOT NULL,
      seal_broken BOOLEAN DEFAULT FALSE,
      restocking_fee_applied NUMERIC(10,2) DEFAULT 0.00,
      status VARCHAR(50) DEFAULT 'AWAITING_INSPECTION' CHECK (status IN ('AWAITING_INSPECTION', 'APPROVED', 'REJECTED_SEAL_BROKEN', 'AUTO_REFUNDED_SLA_BREACH')),
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_return_inspections_ext_order ON enforcement.return_inspections_ext(order_id);
    ALTER TABLE enforcement.return_inspections_ext ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS enforcement.asin_locks (
  lock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE UNIQUE,
  review_count INT DEFAULT 0,
  is_title_locked BOOLEAN GENERATED ALWAYS AS (review_count >= 10) STORED,
  is_category_locked BOOLEAN GENERATED ALWAYS AS (review_count >= 5) STORED,
  last_checked_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_asin_locks_product ON enforcement.asin_locks(product_id);

ALTER TABLE enforcement.asin_locks ENABLE ROW LEVEL SECURITY;
