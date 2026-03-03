-- ============================================
-- Altersverifizierungssystem (AVS)
-- Datensparsam: Nur Prüfungsergebnis (APPROVED/REJECTED), keine Ausweiskopien
-- ============================================

-- Log-Tabelle: Nur Ergebnis der Prüfung (DSGVO-konform, keine sensiblen Daten)
CREATE TABLE IF NOT EXISTS age_verification_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  result TEXT NOT NULL CHECK (result IN ('APPROVED', 'REJECTED')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_age_verification_logs_user ON age_verification_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_age_verification_logs_created ON age_verification_logs(created_at);

COMMENT ON TABLE age_verification_logs IS 'Nur Ergebnis der Altersprüfung (APPROVED/REJECTED). Keine Ausweisdaten. DSGVO-konform.';

-- Persistente Verifizierung für angemeldete Nutzer (keine erneute Prüfung bei Folgekäufen)
CREATE TABLE IF NOT EXISTS age_verification_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  is_age_verified BOOLEAN NOT NULL DEFAULT false,
  verified_at TIMESTAMPTZ
);

COMMENT ON TABLE age_verification_profiles IS 'Speichert, ob angemeldete Nutzer bereits verifiziert sind (is_age_verified). Keine erneute Prüfung nötig.';

-- Einmal-Tokens für Checkout (Gäste + Session-basierte Validierung)
CREATE TABLE IF NOT EXISTS age_verification_tokens (
  token TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_age_verification_tokens_expires ON age_verification_tokens(expires_at);

COMMENT ON TABLE age_verification_tokens IS 'Einmal-Tokens für Checkout. Nach Nutzung ungültig.';

-- RLS: Logs nur lesbar für Admins (via Service Role), Schreibzugriff nur über API
ALTER TABLE age_verification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_verification_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE age_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Nutzer darf eigenes Profil lesen (für UI: "Bereits verifiziert")
CREATE POLICY "Users can read own age verification profile"
  ON age_verification_profiles FOR SELECT
  USING (auth.uid() = user_id);
