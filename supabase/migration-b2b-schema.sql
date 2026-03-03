-- Phase 10.4: B2B-Konten, Staffelpreise
-- b2b.business_accounts: Geschäftskunden mit USt-IdNr.
-- b2b.tiered_pricing: Staffelpreise pro Produkt (ab X Stück: Y €/Stück)

CREATE SCHEMA IF NOT EXISTS b2b;

-- Geschäftskunden-Konten (Verknüpfung User → B2B)
CREATE TABLE IF NOT EXISTS b2b.business_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name VARCHAR(255) NOT NULL,
  vat_id VARCHAR(50),
  vat_validated_at TIMESTAMPTZ,
  billing_address JSONB,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejected_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_b2b_business_accounts_user ON b2b.business_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_b2b_business_accounts_status ON b2b.business_accounts(status);
COMMENT ON TABLE b2b.business_accounts IS 'B2B-Geschäftskunden mit USt-IdNr.-Validierung';

-- Staffelpreise pro Produkt (ab min_quantity: unit_price)
CREATE TABLE IF NOT EXISTS b2b.tiered_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  min_quantity INT NOT NULL CHECK (min_quantity >= 1),
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price >= 0),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(product_id, min_quantity)
);

CREATE INDEX IF NOT EXISTS idx_b2b_tiered_pricing_product ON b2b.tiered_pricing(product_id);
COMMENT ON TABLE b2b.tiered_pricing IS 'Staffelpreise: ab min_quantity Stück gilt unit_price';

ALTER TABLE b2b.business_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b.tiered_pricing ENABLE ROW LEVEL SECURITY;
