-- ============================================
-- Blueprint Teil 9: Deep Tech & Scalability
-- De-Duplizierung, Risk-Based AVS, Ledger-Reconciliation, Live-Streams, 3D Bin-Packing
-- ============================================

CREATE SCHEMA IF NOT EXISTS deep_tech;

CREATE TABLE IF NOT EXISTS deep_tech.catalog_duplicates (
  duplicate_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  original_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  duplicate_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  image_phash VARCHAR(64),
  similarity_score NUMERIC(5,4),
  status VARCHAR(20) DEFAULT 'PENDING_MERGE' CHECK (status IN ('PENDING_MERGE', 'MERGED', 'DISMISSED')),
  detected_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deep_tech_duplicates_status ON deep_tech.catalog_duplicates(status);

CREATE TABLE IF NOT EXISTS deep_tech.risk_evaluations (
  evaluation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cart_total NUMERIC(10,2) NOT NULL,
  contains_high_risk_item BOOLEAN DEFAULT FALSE,
  required_avs_level VARCHAR(50) CHECK (required_avs_level IN ('STANDARD_SCHUFA', 'BIOMETRIC_LIVENESS')),
  evaluated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deep_tech.payout_batches (
  batch_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  gross_sales NUMERIC(10,2) DEFAULT 0.00,
  total_fees NUMERIC(10,2) DEFAULT 0.00,
  net_payout NUMERIC(10,2) GENERATED ALWAYS AS (gross_sales - total_fees) STORED,
  payout_status VARCHAR(20) DEFAULT 'PROCESSING' CHECK (payout_status IN ('PROCESSING', 'PAID', 'FAILED')),
  bank_reference VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_deep_tech_payouts_status ON deep_tech.payout_batches(payout_status);

CREATE TABLE IF NOT EXISTS deep_tech.live_streams (
  stream_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  stream_title VARCHAR(255) NOT NULL,
  hls_stream_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'LIVE', 'ENDED', 'VOD')),
  viewer_count INT DEFAULT 0,
  started_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS deep_tech.live_stream_products (
  mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stream_id UUID NOT NULL REFERENCES deep_tech.live_streams(stream_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  featured_timestamp_start INT,
  featured_timestamp_end INT
);

CREATE TABLE IF NOT EXISTS deep_tech.standard_boxes (
  box_id VARCHAR(50) PRIMARY KEY,
  length_mm INT NOT NULL,
  width_mm INT NOT NULL,
  height_mm INT NOT NULL,
  max_weight_grams INT NOT NULL
);

CREATE TABLE IF NOT EXISTS deep_tech.order_packaging_plans (
  plan_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  assigned_box_id VARCHAR(50) REFERENCES deep_tech.standard_boxes(box_id),
  total_volume_mm3 BIGINT,
  total_weight_grams INT,
  void_fill_percentage NUMERIC(5,2),
  calculated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE deep_tech.catalog_duplicates ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_tech.risk_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_tech.payout_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_tech.live_streams ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_tech.live_stream_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_tech.standard_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_tech.order_packaging_plans ENABLE ROW LEVEL SECURITY;
