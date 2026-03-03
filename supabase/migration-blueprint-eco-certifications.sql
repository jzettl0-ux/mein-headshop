-- ============================================
-- Blueprint 2.5: Eco-Zertifizierungen
-- ============================================

-- catalog Schema existiert (migration-asin-parent-child)
-- ASIN-FK optional (Produkte können auch ohne ASIN sein)

CREATE TABLE IF NOT EXISTS catalog.eco_certifications (
  cert_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  asin VARCHAR(15),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  certification_type VARCHAR(100) NOT NULL,
  document_url TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'REJECTED')),
  verified_by_admin UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_eco_cert_product ON catalog.eco_certifications(product_id);
CREATE INDEX IF NOT EXISTS idx_eco_cert_asin ON catalog.eco_certifications(asin) WHERE status = 'VERIFIED' AND asin IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_eco_cert_status ON catalog.eco_certifications(status);

COMMENT ON TABLE catalog.eco_certifications IS 'Nachhaltigkeits-Zertifikate (FSC, EU-Bio, GOTS); Badge nach Admin-Review';

ALTER TABLE catalog.eco_certifications ENABLE ROW LEVEL SECURITY;
