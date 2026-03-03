-- Phase 11.3: Klickbare Coupons (Voucher Badges), Budget-Deckelung
-- advanced_ops.coupons: Badge-Anzeige in Suchergebnissen, Budget-Obergrenze

CREATE SCHEMA IF NOT EXISTS advanced_ops;

CREATE TABLE IF NOT EXISTS advanced_ops.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  badge_label TEXT NOT NULL,
  budget_eur DECIMAL(10,2),
  budget_used_eur DECIMAL(10,2) NOT NULL DEFAULT 0,
  scope TEXT NOT NULL DEFAULT 'all' CHECK (scope IN ('all', 'category', 'product')),
  scope_value TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT chk_budget CHECK (budget_eur IS NULL OR budget_eur >= 0),
  CONSTRAINT chk_budget_used CHECK (budget_used_eur >= 0)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_coupons_discount_code ON advanced_ops.coupons(discount_code_id);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON advanced_ops.coupons(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_coupons_scope ON advanced_ops.coupons(scope, scope_value);

COMMENT ON TABLE advanced_ops.coupons IS 'Phase 11.3: Klickbare Voucher-Badges, Budget-Deckelung';
COMMENT ON COLUMN advanced_ops.coupons.badge_label IS 'Anzeigetext für Badge (z.B. „5 € sparen“)';
COMMENT ON COLUMN advanced_ops.coupons.budget_eur IS 'Budget-Obergrenze in €; NULL = keine Begrenzung';
COMMENT ON COLUMN advanced_ops.coupons.budget_used_eur IS 'Bereits verbrauchtes Budget';
COMMENT ON COLUMN advanced_ops.coupons.scope IS 'all = überall, category = nur in Kategorie, product = nur bei Produkt';
COMMENT ON COLUMN advanced_ops.coupons.scope_value IS 'Bei scope=category: Kategorie-Slug; bei scope=product: product_id';

ALTER TABLE advanced_ops.coupons ENABLE ROW LEVEL SECURITY;
