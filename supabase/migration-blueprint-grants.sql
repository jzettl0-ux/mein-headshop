-- Grants für alle neuen Blueprint-Schemas
GRANT USAGE ON SCHEMA gamification TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA gamification TO service_role;
GRANT USAGE ON SCHEMA community TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA community TO service_role;
GRANT USAGE ON SCHEMA checkout TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA checkout TO service_role;
GRANT USAGE ON SCHEMA enforcement TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA enforcement TO service_role;
GRANT USAGE ON SCHEMA advanced_financials TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA advanced_financials TO service_role;
GRANT USAGE ON SCHEMA catalog_defense TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA catalog_defense TO service_role;
GRANT USAGE ON SCHEMA infrastructure TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA infrastructure TO service_role;
GRANT USAGE ON SCHEMA deep_tech TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA deep_tech TO service_role;
