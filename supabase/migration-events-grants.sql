-- GRANTs für events-Schema – Behebt "permission denied for schema events"
-- Der Trigger events.emit_order_created wird bei INSERT auf orders ausgeführt.
-- Die ausführende Rolle (authenticated, anon, service_role) braucht USAGE auf dem Schema
-- und EXECUTE auf der Trigger-Funktion, damit der Trigger ausgelöst werden kann.

GRANT USAGE ON SCHEMA events TO authenticated;
GRANT USAGE ON SCHEMA events TO anon;
GRANT USAGE ON SCHEMA events TO service_role;

GRANT INSERT, SELECT ON events.domain_events TO authenticated;
GRANT INSERT, SELECT ON events.domain_events TO anon;
GRANT INSERT, SELECT ON events.domain_events TO service_role;

-- Trigger-Funktionen müssen von den Rollen ausgeführt werden können
GRANT EXECUTE ON FUNCTION events.emit_order_created() TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_order_created() TO anon;
GRANT EXECUTE ON FUNCTION events.emit_order_created() TO service_role;

GRANT EXECUTE ON FUNCTION events.emit_payment_received() TO authenticated;
GRANT EXECUTE ON FUNCTION events.emit_payment_received() TO anon;
GRANT EXECUTE ON FUNCTION events.emit_payment_received() TO service_role;

-- RLS-Policies: Trigger schreibt bei Order-INSERT als authenticated/anon
CREATE POLICY "Allow insert for order triggers"
  ON events.domain_events FOR INSERT
  TO authenticated, anon, service_role
  WITH CHECK (true);

CREATE POLICY "Allow select for service_role"
  ON events.domain_events FOR SELECT
  TO service_role
  USING (true);
