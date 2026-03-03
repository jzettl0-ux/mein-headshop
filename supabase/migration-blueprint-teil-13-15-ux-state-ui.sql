-- ============================================
-- Blueprint Teil 13–15: Frictionless Shopping, Immersive UI & State Management
-- Teil 13: 1-Click Checkout, Buy It Again, Search Autocomplete, Component Registry
-- Teil 14: 3D Assets (optional), Cross-Device Cart, Category Facet Config
-- Teil 15: Homepage Layouts, A+ Module Types, Checkout Funnel Analytics
-- ============================================

CREATE SCHEMA IF NOT EXISTS frontend_ux;
CREATE SCHEMA IF NOT EXISTS customer_profiles;
CREATE SCHEMA IF NOT EXISTS storefront;
CREATE SCHEMA IF NOT EXISTS ui_config;
CREATE SCHEMA IF NOT EXISTS funnel_analytics;

-- =================================================================
-- TEIL 13: 1-CLICK CHECKOUT PREFERENCES
-- =================================================================
CREATE TABLE IF NOT EXISTS customer_profiles.checkout_preferences (
    customer_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    one_click_enabled BOOLEAN DEFAULT FALSE,
    default_shipping_address_id UUID,
    default_payment_method_id VARCHAR(255),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- TEIL 13: PREDICTIVE REPLENISHMENT (BUY IT AGAIN)
-- =================================================================
CREATE TABLE IF NOT EXISTS frontend_ux.replenishment_predictions (
    prediction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    last_purchased_date DATE NOT NULL,
    calculated_cycle_days INT NOT NULL,
    next_expected_purchase_date DATE GENERATED ALWAYS AS (last_purchased_date + calculated_cycle_days) STORED,
    is_dismissed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(customer_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_ux_replenishment ON frontend_ux.replenishment_predictions(next_expected_purchase_date) WHERE is_dismissed = FALSE;

-- =================================================================
-- TEIL 13: SEARCH AUTOCOMPLETE ANALYTICS
-- =================================================================
CREATE TABLE IF NOT EXISTS frontend_ux.search_autocomplete_analytics (
    log_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partial_search_term VARCHAR(255) NOT NULL,
    clicked_product_id UUID REFERENCES products(id) ON DELETE SET NULL,
    conversion_from_search BOOLEAN DEFAULT FALSE,
    event_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_ux_search_analytics ON frontend_ux.search_autocomplete_analytics(partial_search_term);

-- =================================================================
-- TEIL 13: MICRO-FRONTEND COMPONENT REGISTRY
-- =================================================================
CREATE TABLE IF NOT EXISTS frontend_ux.component_registry (
    component_id VARCHAR(100) PRIMARY KEY,
    service_endpoint_url VARCHAR(500) NOT NULL,
    fallback_behavior VARCHAR(50) DEFAULT 'HIDE' CHECK (fallback_behavior IN ('HIDE', 'SHOW_CACHED', 'SHOW_ERROR_MSG')),
    timeout_ms INT DEFAULT 2000,
    is_active BOOLEAN DEFAULT TRUE
);

-- =================================================================
-- TEIL 14: CART MANAGEMENT (Cross-Device) – nur wenn cart_management nicht existiert
-- =================================================================
CREATE SCHEMA IF NOT EXISTS cart_management;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cart_management' AND table_name = 'shopping_carts') THEN
    CREATE TABLE cart_management.shopping_carts (
        cart_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
        session_id VARCHAR(255),
        status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MERGED', 'CONVERTED_TO_ORDER', 'ABANDONED')),
        merged_into_cart_id UUID,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE TABLE cart_management.cart_items (
        item_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL REFERENCES cart_management.shopping_carts(cart_id) ON DELETE CASCADE,
        product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
        quantity INT NOT NULL CHECK (quantity > 0),
        added_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(cart_id, product_id)
    );
    CREATE INDEX IF NOT EXISTS idx_carts_customer ON cart_management.shopping_carts(customer_id) WHERE status = 'ACTIVE';
    CREATE INDEX IF NOT EXISTS idx_carts_session ON cart_management.shopping_carts(session_id) WHERE status = 'ACTIVE';
  END IF;
END $$;

-- =================================================================
-- TEIL 14: CATEGORY FACET CONFIG (dynamische Filter)
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'admin' AND table_name = 'gated_categories') THEN
    CREATE TABLE IF NOT EXISTS storefront.category_facet_config (
        config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID NOT NULL REFERENCES admin.gated_categories(category_id) ON DELETE CASCADE,
        jsonb_attribute_key VARCHAR(100) NOT NULL,
        display_label VARCHAR(100) NOT NULL,
        ui_component_type VARCHAR(50) CHECK (ui_component_type IN ('CHECKBOX', 'RADIO', 'RANGE_SLIDER', 'COLOR_SWATCH')),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(category_id, jsonb_attribute_key)
    );
  ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'product_categories') THEN
    CREATE TABLE IF NOT EXISTS storefront.category_facet_config (
        config_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        category_id UUID NOT NULL REFERENCES product_categories(id) ON DELETE CASCADE,
        jsonb_attribute_key VARCHAR(100) NOT NULL,
        display_label VARCHAR(100) NOT NULL,
        ui_component_type VARCHAR(50) CHECK (ui_component_type IN ('CHECKBOX', 'RADIO', 'RANGE_SLIDER', 'COLOR_SWATCH')),
        sort_order INT DEFAULT 0,
        is_active BOOLEAN DEFAULT TRUE,
        UNIQUE(category_id, jsonb_attribute_key)
    );
  END IF;
END $$;

-- facet_predefined_values nur wenn category_facet_config existiert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storefront' AND table_name = 'category_facet_config') THEN
    CREATE TABLE IF NOT EXISTS storefront.facet_predefined_values (
      value_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      config_id UUID NOT NULL REFERENCES storefront.category_facet_config(config_id) ON DELETE CASCADE,
      attribute_value VARCHAR(100) NOT NULL,
      display_label VARCHAR(100) NOT NULL,
      sort_order INT DEFAULT 0
    );
  END IF;
END $$;

-- =================================================================
-- TEIL 15: BENTO GRID HOMEPAGE LAYOUTS
-- =================================================================
CREATE TABLE IF NOT EXISTS ui_config.homepage_layouts (
    layout_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    layout_name VARCHAR(100) NOT NULL,
    target_audience VARCHAR(50) CHECK (target_audience IN ('GUEST', 'B2C_LOGGED_IN', 'B2B_CLUB', 'VIP_GOLD')),
    bento_grid_jsonb JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    priority INT DEFAULT 10,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =================================================================
-- TEIL 15: CHECKOUT FUNNEL DROPOFF TRACKING
-- =================================================================
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'cart_management' AND table_name = 'shopping_carts') THEN
    CREATE TABLE IF NOT EXISTS funnel_analytics.checkout_dropoffs (
        dropoff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL REFERENCES cart_management.shopping_carts(cart_id) ON DELETE CASCADE,
        customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        last_completed_step VARCHAR(50) CHECK (last_completed_step IN ('CART_REVIEW', 'ADDRESS_ENTERED', 'SHIPPING_METHOD_SELECTED', 'PAYMENT_ENTERED')),
        time_spent_in_checkout_seconds INT,
        device_type VARCHAR(20) CHECK (device_type IN ('MOBILE', 'DESKTOP', 'TABLET')),
        abandoned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_funnel_step ON funnel_analytics.checkout_dropoffs(last_completed_step, device_type);
  ELSE
    CREATE TABLE IF NOT EXISTS funnel_analytics.checkout_dropoffs (
        dropoff_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        cart_id UUID NOT NULL,
        customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        last_completed_step VARCHAR(50) CHECK (last_completed_step IN ('CART_REVIEW', 'ADDRESS_ENTERED', 'SHIPPING_METHOD_SELECTED', 'PAYMENT_ENTERED')),
        time_spent_in_checkout_seconds INT,
        device_type VARCHAR(20) CHECK (device_type IN ('MOBILE', 'DESKTOP', 'TABLET')),
        abandoned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_funnel_step ON funnel_analytics.checkout_dropoffs(last_completed_step, device_type);
  END IF;
END $$;
