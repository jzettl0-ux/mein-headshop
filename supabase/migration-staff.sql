-- Mitarbeiter & Berechtigungen
-- Nur der Owner (oder E-Mail unten) darf die Tabelle staff verwalten.

-- Tabelle: Mitarbeiter (verknüpft mit auth.users)
CREATE TABLE IF NOT EXISTS staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'support' CHECK (role IN ('owner', 'admin', 'support')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);

COMMENT ON TABLE staff IS 'Mitarbeiter mit Zugriff aufs Admin-Dashboard; Berechtigungen über role.';
COMMENT ON COLUMN staff.role IS 'owner = alles inkl. Mitarbeiter; admin = alles außer Mitarbeiter; support = Bestellungen + Kundenservice';

-- Owner-E-Mail (Haupt-Admin); darf alles und sieht "Mitarbeiter"
-- WICHTIG: Mit deiner E-Mail ersetzen, falls anders
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM staff WHERE email = 'jzettl0@gmail.com' LIMIT 1) THEN
    INSERT INTO staff (email, role, is_active) VALUES ('jzettl0@gmail.com', 'owner', true);
  END IF;
END $$;

-- is_admin(): Haupt-Admin-E-Mail ODER aktiver Mitarbeiter mit Rolle owner/admin/support
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
    OR EXISTS (
      SELECT 1 FROM staff
      WHERE email = (auth.jwt() ->> 'email')
        AND is_active = true
        AND role IN ('owner', 'admin', 'support')
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_owner(): nur Haupt-Admin oder staff mit role = 'owner'
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
    OR EXISTS (
      SELECT 1 FROM staff
      WHERE email = (auth.jwt() ->> 'email')
        AND is_active = true
        AND role = 'owner'
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS für staff: nur Owner darf lesen/schreiben
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only owner can manage staff" ON staff;
CREATE POLICY "Only owner can manage staff"
  ON staff FOR ALL
  USING (is_owner())
  WITH CHECK (is_owner());

-- Service Role kann immer (für API/Backend)
-- Bei Nutzung mit anon/authenticated Key wird nur is_owner() geprüft.
