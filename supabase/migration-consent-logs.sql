-- Anonymisierte Consent-Logs (DSGVO-konform, keine personenbezogenen Daten)
CREATE TABLE IF NOT EXISTS consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  choices JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_logs_created ON consent_logs(created_at DESC);
COMMENT ON TABLE consent_logs IS 'Anonymisierte Protokollierung von Cookie-Consent-Entscheidungen (Consent Mode v2). Keine IP, keine User-ID.';
