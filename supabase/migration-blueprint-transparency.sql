-- ============================================
-- Blueprint 3.1: Transparency-Programm (Anti-Fälschung)
-- ============================================

CREATE SCHEMA IF NOT EXISTS security;

-- Marken im Transparency Programm
CREATE TABLE IF NOT EXISTS security.transparency_brands (
  enrollment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  asin VARCHAR(15),
  is_active BOOLEAN DEFAULT TRUE,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transparency_brands_vendor ON security.transparency_brands(vendor_id);
CREATE INDEX IF NOT EXISTS idx_transparency_brands_asin ON security.transparency_brands(asin) WHERE asin IS NOT NULL;

-- Unique Codes pro physischer Einheit
CREATE TABLE IF NOT EXISTS security.transparency_codes (
  code_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  asin VARCHAR(15),
  unique_qr_code VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'GENERATED' CHECK (status IN ('GENERATED', 'PRINTED', 'SCANNED_AT_FC', 'DELIVERED')),
  scanned_by_vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  scanned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_transparency_code ON security.transparency_codes(unique_qr_code);
CREATE INDEX IF NOT EXISTS idx_transparency_codes_status ON security.transparency_codes(status);

COMMENT ON TABLE security.transparency_codes IS 'Eindeutige QR-Codes pro Einheit; Versand nur nach Scan';

ALTER TABLE security.transparency_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE security.transparency_codes ENABLE ROW LEVEL SECURITY;
