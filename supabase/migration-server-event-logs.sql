-- Server- und Client-Event-Logs für Tracking-Debugging (DSGVO: keine IP, keine User-ID, nur aggregierbare Daten)
CREATE TABLE IF NOT EXISTS server_event_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_name TEXT NOT NULL,
  source TEXT NOT NULL CHECK (source IN ('client', 'server')),
  consent_ok BOOLEAN NOT NULL DEFAULT false,
  forwarded BOOLEAN NOT NULL DEFAULT false,
  params_snapshot JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_server_event_logs_created ON server_event_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_event_logs_source ON server_event_logs(source);
CREATE INDEX IF NOT EXISTS idx_server_event_logs_event_name ON server_event_logs(event_name);
COMMENT ON TABLE server_event_logs IS 'Anonymisierte Event-Logs für Tracking-Integrität (Browser vs. Server). Keine IP, keine personenbezogenen Daten.';
