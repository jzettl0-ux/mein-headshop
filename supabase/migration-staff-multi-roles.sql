-- Mehrere Rollen pro Mitarbeiter: role → roles (TEXT[])
-- Führe NACH migration-staff.sql und migration-staff-roles-extended.sql aus.

-- Spalte roles hinzufügen
ALTER TABLE staff ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{support}';

-- Bestehende Einzel-Rolle in Array übernehmen
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'role') THEN
    UPDATE staff SET roles = ARRAY[role]::TEXT[] WHERE roles IS NULL OR array_length(roles, 1) IS NULL;
    ALTER TABLE staff DROP COLUMN role;
  END IF;
END $$;

-- Sicherstellen: mindestens eine Rolle, nur erlaubte Werte
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_roles_check;
ALTER TABLE staff ADD CONSTRAINT staff_roles_check CHECK (
  array_length(roles, 1) >= 1
  AND roles <@ ARRAY['owner', 'chef', 'admin', 'product_care', 'support', 'employee']::TEXT[]
);

COMMENT ON COLUMN staff.roles IS 'Mehrere Rollen pro Person; Berechtigung = Vereinigung aller Rollen.';

-- is_admin(): mindestens eine Admin-Rolle im Array
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
    OR EXISTS (
      SELECT 1 FROM staff
      WHERE email = (auth.jwt() ->> 'email')
        AND is_active = true
        AND roles && ARRAY['owner', 'chef', 'admin', 'product_care', 'support', 'employee']::TEXT[]
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_owner(): 'owner' im Array oder Haupt-E-Mail
CREATE OR REPLACE FUNCTION is_owner()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
    OR EXISTS (
      SELECT 1 FROM staff
      WHERE email = (auth.jwt() ->> 'email')
        AND is_active = true
        AND 'owner' = ANY(roles)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- is_staff_manager(): 'owner' oder 'chef' im Array
CREATE OR REPLACE FUNCTION is_staff_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
    OR EXISTS (
      SELECT 1 FROM staff
      WHERE email = (auth.jwt() ->> 'email')
        AND is_active = true
        AND roles && ARRAY['owner', 'chef']::TEXT[]
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
