-- ============================================
-- Phase 1.3: Compliance-Schema (Blueprint 4.5)
-- ============================================
-- JuSchG (AVS), DDG Notice & Action, BFSG/KCanG

CREATE SCHEMA IF NOT EXISTS compliance;

-- Jugendschutz & AVS Tracking (KJM-Audits)
-- Erweitert die bestehende age_verification_logs um Blueprint-Felder.
-- Hinweis: age_verification_logs existiert bereits in public – wir legen compliance-Version für Audit-Nachweis an.
CREATE TABLE IF NOT EXISTS compliance.age_verification_logs (
  verification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  verification_method VARCHAR(50) CHECK (verification_method IN ('SCHUFA_QBIT', 'EID_WALLET', 'POSTIDENT', 'AGE_GATE_TOKEN')),
  is_verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  provider_response_hash VARCHAR(256) NOT NULL,
  session_valid_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE compliance.age_verification_logs IS 'AVS-Audit: Pseudonymisierter Hash zur Nachweisbarkeit für KJM. Keine sensiblen Daten.';
COMMENT ON COLUMN compliance.age_verification_logs.provider_response_hash IS 'Pseudonymisierter Hash des Provider-Responses (Datenschutz)';

CREATE INDEX IF NOT EXISTS idx_compliance_avs_customer ON compliance.age_verification_logs(customer_id);
CREATE INDEX IF NOT EXISTS idx_compliance_avs_created ON compliance.age_verification_logs(created_at);

-- DDG Notice & Action (§17 DDG Transparenzbericht)
CREATE TABLE IF NOT EXISTS compliance.ddg_content_reports (
  report_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  target_asin TEXT NOT NULL,
  target_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  violation_type VARCHAR(100) CHECK (violation_type IN ('ILLEGAL_DRUG_CONTENT', 'YOUTH_PROTECTION', 'IP_INFRINGEMENT', 'OTHER')),
  is_trusted_flagger BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'INVESTIGATING', 'REMOVED', 'DISMISSED')),
  action_taken VARCHAR(255),
  reported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE compliance.ddg_content_reports IS 'DDG §17: Meldeverfahren für illegale Inhalte. Transparenzbericht.';

CREATE INDEX IF NOT EXISTS idx_ddg_reports_asin ON compliance.ddg_content_reports(target_asin);
CREATE INDEX IF NOT EXISTS idx_ddg_reports_status ON compliance.ddg_content_reports(status);
CREATE INDEX IF NOT EXISTS idx_ddg_reports_product ON compliance.ddg_content_reports(target_product_id);

-- Vendor Compliance Flags (BFSG, KCanG)
CREATE TABLE IF NOT EXISTS compliance.vendor_legal_flags (
  vendor_id UUID PRIMARY KEY REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  bfsg_micro_enterprise_exemption BOOLEAN DEFAULT false,
  kcan_advertising_ban_acknowledged BOOLEAN DEFAULT false,
  requires_medical_license BOOLEAN DEFAULT false,
  last_audit_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE compliance.vendor_legal_flags IS 'BFSG: <10 MA und <2M Umsatz = Ausnahme. KCanG: Werbeverbot bestätigt.';
COMMENT ON COLUMN compliance.vendor_legal_flags.bfsg_micro_enterprise_exemption IS '§2 Nr.17 BFSG: Kleinstunternehmen von Barrierefreiheitspflicht ausgenommen';
COMMENT ON COLUMN compliance.vendor_legal_flags.kcan_advertising_ban_acknowledged IS 'KCanG §6: Werbeverbot für Cannabis vom Vendor bestätigt';

CREATE TRIGGER update_compliance_vendor_legal_flags_updated_at
  BEFORE UPDATE ON compliance.vendor_legal_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (Admin/Service-Role only; keine public Lesezugriffe)
ALTER TABLE compliance.age_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.ddg_content_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.vendor_legal_flags ENABLE ROW LEVEL SECURITY;
