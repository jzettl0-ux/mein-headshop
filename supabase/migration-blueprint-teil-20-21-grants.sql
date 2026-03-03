-- Grants für Blueprint TEIL 20 & 21 (nach migration-blueprint-teil-20-21-micro-logistics-visual-merchandising.sql)
GRANT USAGE ON SCHEMA logistics_optimization TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA logistics_optimization TO service_role;
GRANT USAGE ON SCHEMA catalog_automation TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog_automation TO service_role;
GRANT USAGE ON SCHEMA vendor_performance TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA vendor_performance TO service_role;
GRANT USAGE ON SCHEMA customer_engagement TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA customer_engagement TO service_role;
GRANT USAGE ON SCHEMA visual_merchandising TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA visual_merchandising TO service_role;
GRANT USAGE ON SCHEMA guided_selling TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA guided_selling TO service_role;
