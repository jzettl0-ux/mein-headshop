-- MCF: Berechtigungen für logistics Schema

GRANT USAGE ON SCHEMA logistics TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON logistics.mcf_orders TO service_role;
