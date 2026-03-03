-- ============================================
-- Blueprint Supplement: Fehlende Tabellen aus Teil 11, 14, 15
-- IPI-Score (Teil 11), 3D-Assets (Teil 14), A+ Module Types (Teil 15)
-- ============================================

-- =================================================================
-- TEIL 11: INVENTORY PERFORMANCE INDEX (IPI)
-- =================================================================
CREATE SCHEMA IF NOT EXISTS advanced_logistics;

CREATE TABLE IF NOT EXISTS advanced_logistics.ipi_scores (
    vendor_id UUID PRIMARY KEY REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    sell_through_rate_90d NUMERIC(5,2) DEFAULT 0.00,
    overstock_percentage NUMERIC(5,2) DEFAULT 0.00,
    stranded_inventory_percentage NUMERIC(5,2) DEFAULT 0.00,
    ipi_score INT DEFAULT 500,
    inbound_creation_blocked BOOLEAN GENERATED ALWAYS AS (ipi_score < 400) STORED,
    last_evaluated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_logistics_ipi_blocked ON advanced_logistics.ipi_scores(inbound_creation_blocked) WHERE inbound_creation_blocked = TRUE;

-- =================================================================
-- TEIL 14: 3D-MODELLE & AR-ASSETS
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'catalog') THEN
    CREATE TABLE IF NOT EXISTS catalog.product_3d_assets (
        asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
        asset_type VARCHAR(20) CHECK (asset_type IN ('GLB', 'GLTF', 'USDZ')),
        file_url VARCHAR(500) NOT NULL,
        file_size_bytes BIGINT,
        status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('PROCESSING', 'ACTIVE', 'REJECTED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, asset_type)
    );
  ELSE
    CREATE SCHEMA IF NOT EXISTS catalog;
    CREATE TABLE IF NOT EXISTS catalog.product_3d_assets (
        asset_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
        asset_type VARCHAR(20) CHECK (asset_type IN ('GLB', 'GLTF', 'USDZ')),
        file_url VARCHAR(500) NOT NULL,
        file_size_bytes BIGINT,
        status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('PROCESSING', 'ACTIVE', 'REJECTED')),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(product_id, asset_type)
    );
  END IF;
END $$;

-- =================================================================
-- TEIL 15: A+ MODULE TYPES (Scrollytelling Config)
-- =================================================================
CREATE TABLE IF NOT EXISTS ui_config.aplus_module_types (
    module_type_id VARCHAR(50) PRIMARY KEY,
    requires_light_theme_assets BOOLEAN DEFAULT TRUE,
    max_text_characters INT,
    allowed_media_formats JSONB
);
