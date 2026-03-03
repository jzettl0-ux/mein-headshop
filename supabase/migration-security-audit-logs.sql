-- DSGVO/Security: Log für GDPR-Datenexporte und sensible Aktionen
CREATE TABLE IF NOT EXISTS security_audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_security_audit_logs_event ON security_audit_logs(event);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_user ON security_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_security_audit_logs_created ON security_audit_logs(created_at DESC);

COMMENT ON TABLE security_audit_logs IS 'Sicherheitsrelevante Ereignisse: GDPR_DATA_EXPORT, GDPR_DELETE_REQUEST, etc.';

-- Angeforderte Konto-Löschungen (Art. 17 DSGVO), Bestätigung per E-Mail-Link
CREATE TABLE IF NOT EXISTS gdpr_deletion_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  confirmed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_token ON gdpr_deletion_requests(token);
CREATE INDEX IF NOT EXISTS idx_gdpr_deletion_requests_user ON gdpr_deletion_requests(user_id);

COMMENT ON TABLE gdpr_deletion_requests IS 'Ausstehende Konto-Löschungen; Bestätigung per Link mit token.';
