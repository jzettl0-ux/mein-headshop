-- ============================================
-- Blueprint TEIL 20: Micro-Logistics, Catalog Automation & Badging (1:1)
-- Blueprint TEIL 21: Visual Merchandising & Discovery (1:1)
-- Voraussetzung: catalog.amazon_standard_identification_numbers (Phase 1 ASIN),
--                admin.gated_categories (Phase 1), orders = fulfillment.orders → orders(id)
--                vendors.accounts → vendor_accounts(id)
-- ============================================

CREATE SCHEMA IF NOT EXISTS logistics_optimization;
CREATE SCHEMA IF NOT EXISTS catalog_automation;
CREATE SCHEMA IF NOT EXISTS vendor_performance;
CREATE SCHEMA IF NOT EXISTS customer_engagement;
CREATE SCHEMA IF NOT EXISTS visual_merchandising;
CREATE SCHEMA IF NOT EXISTS guided_selling;

-- =================================================================
-- TEIL 20.1: FBA SMALL & LIGHT – Routing-Regeln + catalog.product_attributes
-- =================================================================
CREATE TABLE IF NOT EXISTS logistics_optimization.routing_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_weight_grams INT NOT NULL,
  max_thickness_mm INT NOT NULL,
  max_price_value NUMERIC(10,2) NOT NULL,
  assigned_shipping_method VARCHAR(50) DEFAULT 'LETTER_TRACKED',
  is_active BOOLEAN DEFAULT TRUE
);

-- catalog.product_attributes (Blueprint: ALTER TABLE catalog.product_attributes ADD COLUMN …)
CREATE SCHEMA IF NOT EXISTS catalog;
CREATE TABLE IF NOT EXISTS catalog.product_attributes (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE
);
ALTER TABLE catalog.product_attributes ADD COLUMN IF NOT EXISTS physical_thickness_mm INT;
ALTER TABLE catalog.product_attributes ADD COLUMN IF NOT EXISTS physical_weight_grams INT;
COMMENT ON TABLE catalog.product_attributes IS 'Physische Attribute für Small & Light (Gewicht, Dicke)';

-- =================================================================
-- TEIL 20.2: VIRTUAL PRODUCT BUNDLES (bundle_asin, component_asin → catalog)
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'catalog' AND table_name = 'amazon_standard_identification_numbers') THEN
    CREATE TABLE IF NOT EXISTS catalog_automation.virtual_bundles (
      bundle_asin VARCHAR(15) PRIMARY KEY REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE CASCADE,
      vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
      bundle_title VARCHAR(255) NOT NULL,
      bundle_price NUMERIC(10,2) NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE IF NOT EXISTS catalog_automation.virtual_bundle_components (
      mapping_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      bundle_asin VARCHAR(15) NOT NULL REFERENCES catalog_automation.virtual_bundles(bundle_asin) ON DELETE CASCADE,
      component_asin VARCHAR(15) NOT NULL REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE CASCADE,
      quantity_required INT DEFAULT 1,
      UNIQUE(bundle_asin, component_asin)
    );
  END IF;
END $$;

-- =================================================================
-- TEIL 20.3: SELLER-FULFILLED PRIME (SFP) – mit GENERATED on_time_delivery_rate
-- =================================================================
CREATE TABLE IF NOT EXISTS vendor_performance.sfp_trials (
  trial_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID UNIQUE NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  trial_start_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  orders_shipped_count INT DEFAULT 0,
  on_time_deliveries_count INT DEFAULT 0,
  valid_tracking_count INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'IN_PROGRESS' CHECK (status IN ('IN_PROGRESS', 'APPROVED', 'FAILED', 'REVOKED')),
  on_time_delivery_rate NUMERIC(5,4) GENERATED ALWAYS AS (
    CASE WHEN orders_shipped_count = 0 THEN 1.0000
    ELSE on_time_deliveries_count::NUMERIC / orders_shipped_count END
  ) STORED,
  last_evaluated_at TIMESTAMP WITH TIME ZONE
);
CREATE INDEX IF NOT EXISTS idx_sfp_status ON vendor_performance.sfp_trials(status);

-- =================================================================
-- TEIL 20.4: STRANDED INVENTORY – liquidation_eligible_at per Trigger (GENERATED nicht immutable)
-- =================================================================
CREATE TABLE IF NOT EXISTS logistics_optimization.stranded_inventory (
  stranded_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  asin VARCHAR(15) NOT NULL,
  stranded_quantity INT NOT NULL,
  stranded_reason VARCHAR(50) CHECK (stranded_reason IN ('LISTING_DELETED', 'ACCOUNT_SUSPENDED', 'COMPLIANCE_MISSING')),
  stranded_since TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  accumulated_fees NUMERIC(10,2) DEFAULT 0.00,
  liquidation_eligible_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(20) DEFAULT 'PENDING_ACTION' CHECK (status IN ('PENDING_ACTION', 'REMOVAL_REQUESTED', 'LIQUIDATED', 'DESTROYED'))
);
CREATE INDEX IF NOT EXISTS idx_stranded_date ON logistics_optimization.stranded_inventory(liquidation_eligible_at) WHERE status = 'PENDING_ACTION';

CREATE OR REPLACE FUNCTION logistics_optimization.stranded_set_liquidation_eligible()
  RETURNS TRIGGER AS $tr$
BEGIN
  NEW.liquidation_eligible_at := NEW.stranded_since + INTERVAL '60 days';
  RETURN NEW;
END; $tr$ LANGUAGE plpgsql;
DROP TRIGGER IF EXISTS trigger_stranded_liquidation_eligible ON logistics_optimization.stranded_inventory;
CREATE TRIGGER trigger_stranded_liquidation_eligible
  BEFORE INSERT OR UPDATE OF stranded_since ON logistics_optimization.stranded_inventory
  FOR EACH ROW EXECUTE PROCEDURE logistics_optimization.stranded_set_liquidation_eligible();

-- =================================================================
-- TEIL 20.5: REQUEST A REVIEW – fulfillment.orders → orders(id), check 5–30 Tage
-- =================================================================
CREATE TABLE IF NOT EXISTS customer_engagement.review_requests (
  request_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_date TIMESTAMP WITH TIME ZONE NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  status VARCHAR(20) DEFAULT 'SENT' CHECK (status IN ('SENT', 'BOUNCED', 'REVIEW_LEFT')),
  CONSTRAINT check_request_timing CHECK (
    requested_at >= delivery_date + INTERVAL '5 days' AND
    requested_at <= delivery_date + INTERVAL '30 days'
  ),
  UNIQUE(order_id)
);

-- =================================================================
-- TEIL 20.6: BEST SELLER RANK & PLATFORM CHOICE (asin, admin.gated_categories)
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'catalog' AND table_name = 'amazon_standard_identification_numbers')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'admin' AND table_name = 'gated_categories') THEN
    CREATE TABLE IF NOT EXISTS catalog_automation.bestseller_ranks (
      rank_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      asin VARCHAR(15) NOT NULL REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE CASCADE,
      category_id UUID NOT NULL REFERENCES admin.gated_categories(category_id) ON DELETE CASCADE,
      calculated_bsr_score NUMERIC(15,4) DEFAULT 0.0000,
      current_rank_position INT,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(asin, category_id)
    );
    CREATE INDEX IF NOT EXISTS idx_bsr_ranking ON catalog_automation.bestseller_ranks(category_id, current_rank_position);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'catalog' AND table_name = 'amazon_standard_identification_numbers') THEN
    CREATE TABLE IF NOT EXISTS catalog_automation.platform_choice_badges (
      badge_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      keyword VARCHAR(100) NOT NULL UNIQUE,
      winning_asin VARCHAR(15) NOT NULL REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE CASCADE,
      cvr_percentage NUMERIC(5,2) NOT NULL,
      return_rate NUMERIC(5,2) NOT NULL,
      awarded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
  END IF;
END $$;

-- =================================================================
-- TEIL 21.7: INTENTIONS-HUBS
-- =================================================================
CREATE TABLE IF NOT EXISTS visual_merchandising.navigation_hubs (
  hub_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hub_name VARCHAR(100) NOT NULL,
  ui_layout_type VARCHAR(50) CHECK (ui_layout_type IN ('BENTO_GRID', 'EDITORIAL_FEED', 'PRODUCT_LIST', 'COUNTDOWN_VAULT')),
  slug_url VARCHAR(100) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  sort_order INT DEFAULT 0
);

-- =================================================================
-- TEIL 21.9/10: HOCHAUFLÖSENDE MEDIEN – asin, check_high_res
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'catalog' AND table_name = 'amazon_standard_identification_numbers') THEN
    CREATE TABLE IF NOT EXISTS visual_merchandising.product_media_assets (
      media_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      asin VARCHAR(15) NOT NULL REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE CASCADE,
      media_type VARCHAR(50) CHECK (media_type IN ('HERO_IMAGE_1600PX', 'HOVER_PREVIEW_VIDEO', '360_SPIN_FRAME', 'LIFESTYLE_IMAGE')),
      file_url VARCHAR(500) NOT NULL,
      resolution_width INT,
      resolution_height INT,
      frame_sequence_number INT DEFAULT 0,
      alt_text VARCHAR(255),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT check_high_res CHECK (
        (media_type = 'HERO_IMAGE_1600PX' AND resolution_width >= 1600 AND resolution_height >= 1600) OR
        (media_type != 'HERO_IMAGE_1600PX')
      )
    );
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'visual_merchandising' AND table_name = 'product_media_assets' AND column_name = 'asin') THEN
    CREATE INDEX IF NOT EXISTS idx_media_asin ON visual_merchandising.product_media_assets(asin, media_type);
  END IF;
END $$;

-- =================================================================
-- TEIL 21.11: DIGITALER SOMMELIER (Guided Selling Quiz)
-- =================================================================
CREATE TABLE IF NOT EXISTS guided_selling.quizzes (
  quiz_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  target_audience VARCHAR(100),
  is_active BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS guided_selling.quiz_questions (
  question_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES guided_selling.quizzes(quiz_id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  ui_control_type VARCHAR(50) CHECK (ui_control_type IN ('IMAGE_CARDS', 'SLIDER', 'BUTTONS')),
  sort_order INT
);

CREATE TABLE IF NOT EXISTS guided_selling.quiz_answers (
  answer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES guided_selling.quiz_questions(question_id) ON DELETE CASCADE,
  answer_label VARCHAR(255) NOT NULL,
  associated_jsonb_filter JSONB NOT NULL,
  icon_url VARCHAR(500)
);

-- =================================================================
-- TEIL 21.12: QUICK VIEW MODAL – asin PK
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'catalog' AND table_name = 'amazon_standard_identification_numbers') THEN
    CREATE TABLE IF NOT EXISTS visual_merchandising.quick_view_config (
      asin VARCHAR(15) PRIMARY KEY REFERENCES catalog.amazon_standard_identification_numbers(asin) ON DELETE CASCADE,
      allow_quick_view BOOLEAN DEFAULT TRUE,
      force_redirect_to_pdp BOOLEAN DEFAULT FALSE
    );
  END IF;
END $$;

-- =================================================================
-- RLS (Blueprint: alle Tabellen)
-- =================================================================
ALTER TABLE logistics_optimization.routing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.product_attributes ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'catalog_automation' AND table_name = 'virtual_bundles') THEN
    ALTER TABLE catalog_automation.virtual_bundles ENABLE ROW LEVEL SECURITY;
    ALTER TABLE catalog_automation.virtual_bundle_components ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE vendor_performance.sfp_trials ENABLE ROW LEVEL SECURITY;
ALTER TABLE logistics_optimization.stranded_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_engagement.review_requests ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'catalog_automation' AND table_name = 'bestseller_ranks') THEN
    ALTER TABLE catalog_automation.bestseller_ranks ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'catalog_automation' AND table_name = 'platform_choice_badges') THEN
    ALTER TABLE catalog_automation.platform_choice_badges ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE visual_merchandising.navigation_hubs ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'visual_merchandising' AND table_name = 'product_media_assets') THEN
    ALTER TABLE visual_merchandising.product_media_assets ENABLE ROW LEVEL SECURITY;
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'visual_merchandising' AND table_name = 'quick_view_config') THEN
    ALTER TABLE visual_merchandising.quick_view_config ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;
ALTER TABLE guided_selling.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE guided_selling.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE guided_selling.quiz_answers ENABLE ROW LEVEL SECURITY;
