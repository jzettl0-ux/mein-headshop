-- Berechtigungen für Schema cx (behebt "permission denied for schema cx")

GRANT USAGE ON SCHEMA cx TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON cx.subscriptions TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON cx.a_to_z_claims TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON cx.vine_products TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON cx.vine_invitations TO anon, authenticated, service_role;
