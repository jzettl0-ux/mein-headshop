-- Phase 4.1: Pending Sessions für Provider-Redirect-Callback
-- Speichert return_url und user_id während der Nutzer beim Identitätsprovider ist

CREATE TABLE IF NOT EXISTS age_verification_pending (
  session_id TEXT PRIMARY KEY,
  return_url TEXT NOT NULL DEFAULT '/checkout',
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL DEFAULT 'unknown',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_age_verification_pending_created ON age_verification_pending(created_at);

COMMENT ON TABLE age_verification_pending IS 'Temporär: return_url + user während Redirect zu Identitätsprovider (Phase 4.1)';

-- RLS: Kein direkter Zugriff (nur über Service Role/API)
ALTER TABLE age_verification_pending ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access age_verification_pending" ON age_verification_pending;
CREATE POLICY "No direct access age_verification_pending"
  ON age_verification_pending FOR ALL
  USING (false)
  WITH CHECK (false);
