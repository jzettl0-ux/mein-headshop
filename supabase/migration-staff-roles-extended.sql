-- Erweiterte Rollen: Chef, Produktpflege, einfache Mitarbeiter
-- Mitarbeiter-Verwaltung (Anlegen, Pausieren, Löschen) dürfen Owner UND Chef (is_staff_manager).
-- HINWEIS: Läuft nur, wenn staff.role noch existiert. Bei staff.roles (nach migration-staff-multi-roles) wird übersprungen.

DO $$
BEGIN
  -- Wenn staff.role nicht existiert (bereits auf roles migriert), nichts tun
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'role') THEN
    RETURN;
  END IF;

  -- Rollen-Check erweitern (bestehende Constraint ersetzen)
  ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_role_check;
  ALTER TABLE staff ADD CONSTRAINT staff_role_check CHECK (
    role IN ('owner', 'chef', 'admin', 'product_care', 'support', 'employee')
  );

  COMMENT ON COLUMN staff.role IS 'owner/chef = voller Zugriff inkl. Mitarbeiter; admin = alles außer Mitarbeiter; product_care = Produkte/Influencer/Startseite; support/employee = Bestellungen + Kundenservice';
END $$;

-- Funktionen: Dynamisch erstellen je nach Schema (role vs. roles)
DO $$
BEGIN
  -- Fall 1: staff.roles existiert (nach migration-staff-multi-roles)
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'roles') THEN
    EXECUTE $exec$
      CREATE OR REPLACE FUNCTION is_staff_manager()
      RETURNS BOOLEAN AS $inner$
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
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION is_admin()
      RETURNS BOOLEAN AS $inner$
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
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION is_owner()
      RETURNS BOOLEAN AS $inner$
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
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;
    $exec$;
  -- Fall 2: staff.role existiert (vor migration-staff-multi-roles)
  ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'role') THEN
    EXECUTE $exec2$
      CREATE OR REPLACE FUNCTION is_staff_manager()
      RETURNS BOOLEAN AS $inner$
      BEGIN
        RETURN (
          (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
          OR EXISTS (
            SELECT 1 FROM staff
            WHERE email = (auth.jwt() ->> 'email')
              AND is_active = true
              AND role IN ('owner', 'chef')
          )
        );
      END;
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION is_admin()
      RETURNS BOOLEAN AS $inner$
      BEGIN
        RETURN (
          (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
          OR EXISTS (
            SELECT 1 FROM staff
            WHERE email = (auth.jwt() ->> 'email')
              AND is_active = true
              AND role IN ('owner', 'chef', 'admin', 'product_care', 'support', 'employee')
          )
        );
      END;
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;

      CREATE OR REPLACE FUNCTION is_owner()
      RETURNS BOOLEAN AS $inner$
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
      $inner$ LANGUAGE plpgsql SECURITY DEFINER;
    $exec2$;
  END IF;
END $$;

-- RLS: Staff-Verwaltung nur für Owner und Chef
DROP POLICY IF EXISTS "Only owner can manage staff" ON staff;
DROP POLICY IF EXISTS "Only staff managers can manage staff" ON staff;
CREATE POLICY "Only staff managers can manage staff"
  ON staff FOR ALL
  USING (is_staff_manager())
  WITH CHECK (is_staff_manager());
