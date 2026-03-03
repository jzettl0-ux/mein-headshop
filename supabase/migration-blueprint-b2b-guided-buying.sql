-- ============================================
-- Blueprint 3.2: B2B Guided Buying & Genehmigungs-Workflows
-- ============================================

-- b2b Schema existiert (migration-b2b-schema)

-- Einkaufsrichtlinien
CREATE TABLE IF NOT EXISTS b2b.purchasing_policies (
  policy_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  b2b_account_id UUID NOT NULL REFERENCES b2b.business_accounts(id) ON DELETE CASCADE,
  policy_type VARCHAR(50) CHECK (policy_type IN ('ORDER_LIMIT', 'RESTRICTED_CATEGORY', 'PREFERRED_VENDOR')),
  policy_value NUMERIC(10,2),
  target_category_id UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  action_on_violation VARCHAR(20) DEFAULT 'REQUIRE_APPROVAL' CHECK (action_on_violation IN ('BLOCK', 'REQUIRE_APPROVAL', 'WARN_ONLY')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_purchasing_policies_b2b ON b2b.purchasing_policies(b2b_account_id);

-- Bestellungen auf Freigabe wartend
CREATE TABLE IF NOT EXISTS b2b.order_approvals (
  approval_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  b2b_account_id UUID NOT NULL REFERENCES b2b.business_accounts(id) ON DELETE CASCADE,
  requested_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  violated_policy_id UUID REFERENCES b2b.purchasing_policies(policy_id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  reviewed_by_admin_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_approvals_order ON b2b.order_approvals(order_id);
CREATE INDEX IF NOT EXISTS idx_order_approvals_status ON b2b.order_approvals(status);

COMMENT ON TABLE b2b.purchasing_policies IS 'Guided Buying: Limits, Kategorie-Sperren, Preferred Vendor';
COMMENT ON TABLE b2b.order_approvals IS 'Frozen orders waiting for approval';

ALTER TABLE b2b.purchasing_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE b2b.order_approvals ENABLE ROW LEVEL SECURITY;
