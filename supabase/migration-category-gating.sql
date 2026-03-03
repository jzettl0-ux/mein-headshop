-- ============================================
-- Phase 1.5: Category Gating (Blueprint 9.4)
-- ============================================
-- Gated Categories, Vendor Approval-Workflow, Commission Rules Engine

CREATE SCHEMA IF NOT EXISTS admin;

-- Gated Categories (beschränkte Kategorien)
CREATE TABLE IF NOT EXISTS admin.gated_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  requires_approval BOOLEAN DEFAULT true,
  required_document_types JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(category_id)
);

COMMENT ON TABLE admin.gated_categories IS 'Kategorien mit Genehmigungspflicht für Vendoren (z. B. Cannabissamen, Vaporizer)';
COMMENT ON COLUMN admin.gated_categories.required_document_types IS 'Array erlaubter Dok-Typen für Approval: ["letter_of_authorization", "invoices", "safety_data_sheet"]';

CREATE INDEX IF NOT EXISTS idx_gated_categories_category ON admin.gated_categories(category_id);

-- Vendor Category Approvals (Freigabe-Workflow)
CREATE TABLE IF NOT EXISTS admin.vendor_category_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'REVOKED')),
  documents_provided JSONB,
  reviewed_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(vendor_id, category_id)
);

COMMENT ON TABLE admin.vendor_category_approvals IS 'Freigabe: Vendor darf in gated category verkaufen nach Admin-Prüfung';

CREATE INDEX IF NOT EXISTS idx_vendor_category_approvals_vendor ON admin.vendor_category_approvals(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_category_approvals_category ON admin.vendor_category_approvals(category_id);
CREATE INDEX IF NOT EXISTS idx_vendor_category_approvals_status ON admin.vendor_category_approvals(status);

-- Commission Rules Engine (dynamische Provisionsregeln)
CREATE TABLE IF NOT EXISTS admin.commission_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name VARCHAR(255) NOT NULL,
  category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  percentage_fee NUMERIC(5, 2) NOT NULL,
  fixed_fee NUMERIC(10, 2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 10,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE admin.commission_rules IS 'Provisions-Regelwerk: percentage_fee pro Kategorie/Vendor. Niedrigere priority = höhere Priorität.';
COMMENT ON COLUMN admin.commission_rules.priority IS 'Niedrigere Zahl = wird zuerst angewendet';

CREATE INDEX IF NOT EXISTS idx_commission_rules_category ON admin.commission_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_vendor ON admin.commission_rules(vendor_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_active ON admin.commission_rules(is_active) WHERE is_active = true;

-- RLS (Admin/Service-Role only)
ALTER TABLE admin.gated_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.vendor_category_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin.commission_rules ENABLE ROW LEVEL SECURITY;
