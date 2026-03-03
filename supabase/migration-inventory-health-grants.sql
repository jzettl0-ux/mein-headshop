-- Inventory Health: Berechtigungen für analytics.inventory_health

GRANT USAGE ON SCHEMA analytics TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics.inventory_health TO service_role;
