-- ============================================
-- Phase 14+: Grants für Blueprint Teil 19 Schemas
-- enterprise_b2b, financial_defense, wms_fefo, creator_economy
-- ============================================

GRANT USAGE ON SCHEMA enterprise_b2b TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA enterprise_b2b TO service_role;

GRANT USAGE ON SCHEMA financial_defense TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA financial_defense TO service_role;

GRANT USAGE ON SCHEMA wms_fefo TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA wms_fefo TO service_role;

GRANT USAGE ON SCHEMA creator_economy TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA creator_economy TO service_role;
