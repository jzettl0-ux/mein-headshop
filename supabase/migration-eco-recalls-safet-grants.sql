-- Grants für Blueprint 2.5 (Eco), 3.3 (Recalls), 3.4 (SAFE-T)

-- Eco-Zertifizierungen (catalog Schema)
GRANT USAGE ON SCHEMA catalog TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON catalog.eco_certifications TO service_role;

-- Product Recalls (compliance Schema)
GRANT USAGE ON SCHEMA compliance TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON compliance.product_recalls TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON compliance.recall_customer_notifications TO service_role;

-- SAFE-T Claims (seller_services Schema)
GRANT USAGE ON SCHEMA seller_services TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON seller_services.safet_claims TO service_role;
