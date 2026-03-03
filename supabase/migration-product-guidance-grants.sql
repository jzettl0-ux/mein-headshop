-- Product Guidance: Berechtigungen für analytics

GRANT SELECT, INSERT, UPDATE, DELETE ON analytics.search_term_gaps TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON analytics.vendor_product_recommendations TO service_role;
