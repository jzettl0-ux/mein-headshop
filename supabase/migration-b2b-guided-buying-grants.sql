-- Berechtigungen für B2B Guided Buying (purchasing_policies, order_approvals)

GRANT USAGE ON SCHEMA b2b TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON b2b.purchasing_policies TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON b2b.order_approvals TO service_role;
