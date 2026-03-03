-- Mitarbeiterprofil (Stammdaten für Steuer/Sozialversicherung) + Kündigungsdatum + Beschwerden
-- Führe NACH migration-staff-multi-roles.sql aus (oder migration-staff.sql wenn du nur role hast).

-- ========== STAFF: Profilfelder und Kündigung ==========
-- Orientierung: Personalakte / Sofortmeldung / ELStAM (Geburtsdatum, Steuer-ID, Versicherung, Adresse)

ALTER TABLE staff ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS place_of_birth TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS country_of_birth TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS address_street TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS address_postal_code TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS address_city TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS social_insurance_number TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS health_insurance TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS terminated_at TIMESTAMPTZ;

COMMENT ON COLUMN staff.first_name IS 'Vorname (für Personalakte/Steuer)';
COMMENT ON COLUMN staff.last_name IS 'Nachname (für Personalakte/Steuer)';
COMMENT ON COLUMN staff.date_of_birth IS 'Geburtsdatum';
COMMENT ON COLUMN staff.place_of_birth IS 'Geburtsort';
COMMENT ON COLUMN staff.country_of_birth IS 'Geburtsland (z. B. DEU)';
COMMENT ON COLUMN staff.nationality IS 'Staatsangehörigkeit';
COMMENT ON COLUMN staff.address_street IS 'Straße und Hausnummer';
COMMENT ON COLUMN staff.address_postal_code IS 'PLZ';
COMMENT ON COLUMN staff.address_city IS 'Ort';
COMMENT ON COLUMN staff.tax_id IS 'Steueridentifikationsnummer (11 Ziffern)';
COMMENT ON COLUMN staff.social_insurance_number IS 'Versicherungsnummer (Sozialversicherungsausweis)';
COMMENT ON COLUMN staff.health_insurance IS 'Krankenkasse (Name)';
COMMENT ON COLUMN staff.phone IS 'Telefon';
COMMENT ON COLUMN staff.notes IS 'Interne Notizen (nur Admin)';
COMMENT ON COLUMN staff.terminated_at IS 'Kündigungsdatum; gesetzt bei Austritt, damit keine versehentliche Wiedereinstellung';

CREATE INDEX IF NOT EXISTS idx_staff_terminated_at ON staff(terminated_at) WHERE terminated_at IS NOT NULL;

-- ========== BESCHWERDEN (nur für Admin sichtbar) ==========
CREATE TABLE IF NOT EXISTS staff_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
  author_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  read_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_staff_complaints_staff_id ON staff_complaints(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_complaints_created_at ON staff_complaints(created_at DESC);

COMMENT ON TABLE staff_complaints IS 'Beschwerden von Mitarbeitern; nur Inhaber/Chef können sie einsehen.';

-- RLS: staff_complaints nur über Service Role / Backend zugreifen (kein direkter Frontend-Zugriff auf Tabelle)
ALTER TABLE staff_complaints ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access staff_complaints" ON staff_complaints;
CREATE POLICY "No direct access staff_complaints"
  ON staff_complaints FOR ALL
  USING (false)
  WITH CHECK (false);
