-- ============================================
-- Phase 14: Grants für Blueprint Teil 13–18 Schemas
-- Berechtigungen für service_role auf allen neuen Schemas
-- ============================================

-- Teil 13–15: UX, Cart, Facets, Funnel
GRANT USAGE ON SCHEMA frontend_ux TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA frontend_ux TO service_role;

GRANT USAGE ON SCHEMA customer_profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA customer_profiles TO service_role;

GRANT USAGE ON SCHEMA storefront TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA storefront TO service_role;

GRANT USAGE ON SCHEMA ui_config TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA ui_config TO service_role;

GRANT USAGE ON SCHEMA funnel_analytics TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA funnel_analytics TO service_role;

GRANT USAGE ON SCHEMA cart_management TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA cart_management TO service_role;

-- Teil 16: Retail Media, Brand Boutiques
GRANT USAGE ON SCHEMA retail_media TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA retail_media TO service_role;

GRANT USAGE ON SCHEMA brand_stores TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA brand_stores TO service_role;

-- Sensory Profiles (catalog Schema – falls noch nicht)
GRANT USAGE ON SCHEMA catalog TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog TO service_role;

-- Teil 17: Legal, Vendor Programs
GRANT USAGE ON SCHEMA legal_compliance TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA legal_compliance TO service_role;

GRANT USAGE ON SCHEMA vendor_programs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vendor_programs TO service_role;

-- Advanced Analytics (Market Basket)
GRANT USAGE ON SCHEMA advanced_analytics TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA advanced_analytics TO service_role;

-- Teil 18: Enterprise
GRANT USAGE ON SCHEMA warehouse_ops TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA warehouse_ops TO service_role;

GRANT USAGE ON SCHEMA vendor_central TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vendor_central TO service_role;

GRANT USAGE ON SCHEMA brand_enforcement TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA brand_enforcement TO service_role;
