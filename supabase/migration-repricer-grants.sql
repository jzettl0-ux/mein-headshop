-- Repricer: Berechtigungen für pricing Schema

GRANT USAGE ON SCHEMA pricing TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON pricing.automated_rules TO service_role;
