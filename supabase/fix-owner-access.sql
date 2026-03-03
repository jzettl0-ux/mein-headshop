-- Admin-Zugang wiederherstellen für jzettl0@gmail.com
-- Im Supabase Dashboard: SQL Editor öffnen → alles markieren und ausführen (Run).

-- 1) Bestehenden Eintrag wieder aktivieren (falls deaktiviert oder gekündigt)
UPDATE staff
SET is_active = true, updated_at = now()
WHERE LOWER(email) = 'jzettl0@gmail.com';

-- Kündigungsdatum zurücksetzen, falls Spalte vorhanden
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'terminated_at') THEN
    UPDATE staff SET terminated_at = NULL WHERE LOWER(email) = 'jzettl0@gmail.com';
  END IF;
END $$;

-- 2) Rolle auf owner setzen (falls Tabelle "roles" hat)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'roles') THEN
    UPDATE staff SET roles = ARRAY['owner']::text[] WHERE LOWER(email) = 'jzettl0@gmail.com';
  END IF;
END $$;

-- 3) Falls noch kein Eintrag existiert: neuen Admin anlegen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM staff WHERE LOWER(email) = 'jzettl0@gmail.com') THEN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'roles') THEN
      INSERT INTO staff (email, roles, is_active) VALUES ('jzettl0@gmail.com', ARRAY['owner']::text[], true);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'role') THEN
      INSERT INTO staff (email, role, is_active) VALUES ('jzettl0@gmail.com', 'owner', true);
    END IF;
  END IF;
END $$;
