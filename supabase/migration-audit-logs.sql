-- Audit-Log: Wer hat was wann geändert (Preise, Steuersätze, Bestände, Finanz-Parameter)
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  action TEXT NOT NULL DEFAULT 'update',
  field_name TEXT,
  old_value TEXT,
  new_value TEXT,
  changed_by_email TEXT,
  changed_by_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
COMMENT ON TABLE audit_logs IS 'Änderungshistorie für Preise, Bestände, Steuersätze, Finanz-Parameter';
