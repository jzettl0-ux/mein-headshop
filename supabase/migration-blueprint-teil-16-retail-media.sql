-- ============================================
-- Blueprint Teil 16: High-End Retail Media & Sensory UI Design
-- Native Bento-Ads, Shoppable Editorials, Terpen-Visualizer, Brand Boutiques
-- ============================================

CREATE SCHEMA IF NOT EXISTS retail_media;
CREATE SCHEMA IF NOT EXISTS brand_stores;
CREATE SCHEMA IF NOT EXISTS catalog;

-- =================================================================
-- 1. NATIVE BENTO-GRID ADS (Retail Media)
-- =================================================================
CREATE TABLE IF NOT EXISTS retail_media.native_banners (
    banner_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL,
    target_layout_id UUID REFERENCES ui_config.homepage_layouts(layout_id),
    media_url VARCHAR(500) NOT NULL,
    headline VARCHAR(100),
    cta_link VARCHAR(500) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- 2. SHOPPABLE EDITORIALS & HOTSPOTS
-- =================================================================
CREATE TABLE IF NOT EXISTS retail_media.editorials (
    editorial_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    hero_image_url VARCHAR(500) NOT NULL,
    editorial_text TEXT,
    published_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS retail_media.editorial_hotspots (
    hotspot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    editorial_id UUID NOT NULL REFERENCES retail_media.editorials(editorial_id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    pos_x_percentage NUMERIC(5,2) NOT NULL,
    pos_y_percentage NUMERIC(5,2) NOT NULL,
    pulse_animation_style VARCHAR(50) DEFAULT 'SUBTLE_GLOW',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_editorial_hotspots_product ON retail_media.editorial_hotspots(product_id);

-- =================================================================
-- 3. SENSORY UI & TERPEN-VISUALIZER (produkt_id statt asin)
-- =================================================================
CREATE TABLE IF NOT EXISTS catalog.sensory_profiles (
    profile_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID UNIQUE NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    chart_type VARCHAR(50) DEFAULT 'RADAR' CHECK (chart_type IN ('RADAR', 'BAR', 'COLOR_WHEEL')),
    data_points JSONB NOT NULL,
    ui_color_hex VARCHAR(7) DEFAULT '#000000',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_sensory_profiles_product ON catalog.sensory_profiles(product_id);

-- =================================================================
-- 4. IMMERSIVE BRAND BOUTIQUES (Shop-in-Shop)
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'security' AND table_name = 'transparency_brands') THEN
    CREATE TABLE IF NOT EXISTS brand_stores.custom_storefronts (
        store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_registry_id UUID UNIQUE NOT NULL REFERENCES security.transparency_brands(enrollment_id) ON DELETE CASCADE,
        store_slug VARCHAR(100) UNIQUE NOT NULL,
        hero_video_url VARCHAR(500),
        primary_color_hex VARCHAR(7),
        secondary_color_hex VARCHAR(7),
        layout_modules_jsonb JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'SUSPENDED')),
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  ELSE
    CREATE TABLE IF NOT EXISTS brand_stores.custom_storefronts (
        store_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        brand_registry_id UUID UNIQUE NOT NULL,
        store_slug VARCHAR(100) UNIQUE NOT NULL,
        hero_video_url VARCHAR(500),
        primary_color_hex VARCHAR(7),
        secondary_color_hex VARCHAR(7),
        layout_modules_jsonb JSONB NOT NULL DEFAULT '[]',
        status VARCHAR(20) DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PUBLISHED', 'SUSPENDED')),
        published_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;
