-- GoBD: Audit-Logs manipulationssicher – nur Anfügen, keine Änderung/Löschung
-- Verhindert UPDATE und DELETE auf audit_logs (revisionssichere Aufbewahrung)

CREATE OR REPLACE FUNCTION audit_logs_deny_update_delete()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'audit_logs: Änderungen sind aus GoBD-Gründen nicht erlaubt (append-only)';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'audit_logs: Löschen ist aus GoBD-Gründen nicht erlaubt (append-only)';
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS audit_logs_deny_update_delete_trigger ON audit_logs;
CREATE TRIGGER audit_logs_deny_update_delete_trigger
  BEFORE UPDATE OR DELETE ON audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION audit_logs_deny_update_delete();

COMMENT ON TRIGGER audit_logs_deny_update_delete_trigger ON audit_logs IS 'GoBD: Nur INSERT erlaubt; UPDATE/DELETE blockiert für revisionssichere Aufbewahrung';
