-- Phase 11.2: Brand Registry
-- advanced_ops.brand_registry: Markenverifikation, Katalog-Hoheit, Markenschutz

CREATE SCHEMA IF NOT EXISTS advanced_ops;

CREATE TABLE IF NOT EXISTS advanced_ops.brand_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_type TEXT NOT NULL DEFAULT 'shop' CHECK (owner_type IN ('shop', 'vendor')),
  owner_id UUID,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('pending', 'active', 'suspended')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_brand_registry_name_lower ON advanced_ops.brand_registry(LOWER(TRIM(name)));
CREATE INDEX IF NOT EXISTS idx_brand_registry_owner ON advanced_ops.brand_registry(owner_type, owner_id);
CREATE INDEX IF NOT EXISTS idx_brand_registry_status ON advanced_ops.brand_registry(status) WHERE status = 'active';

COMMENT ON TABLE advanced_ops.brand_registry IS 'Phase 11.2: Marken-Registry – Markenschutz, Katalog-Hoheit (shop = Plattform, vendor = Drittanbieter)';
COMMENT ON COLUMN advanced_ops.brand_registry.owner_type IS 'shop = eigener Shop, vendor = Vendor (owner_id = vendor_accounts.id)';
COMMENT ON COLUMN advanced_ops.brand_registry.owner_id IS 'Bei owner_type=vendor: vendor_accounts.id; bei shop: NULL';

ALTER TABLE advanced_ops.brand_registry ENABLE ROW LEVEL SECURITY;
