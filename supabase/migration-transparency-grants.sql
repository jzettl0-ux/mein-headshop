-- Transparency-Programm: Berechtigungen für security Schema

GRANT USAGE ON SCHEMA security TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON security.transparency_brands TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON security.transparency_codes TO service_role;
