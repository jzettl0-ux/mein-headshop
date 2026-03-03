-- Rolle "hr" (Personal / Einstellung): Darf Mitarbeiter einstellen, anlegen und verwalten.
-- HR darf nicht das Inhaber-Konto ändern und darf keine Rollen "owner" oder "chef" vergeben (nur Inhaber/Chef).

-- 1) staff.roles: 'hr' als erlaubten Slug ergänzen
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_roles_check;
ALTER TABLE staff ADD CONSTRAINT staff_roles_check CHECK (
  array_length(roles, 1) >= 1
  AND roles <@ ARRAY['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'hr']::TEXT[]
);

-- 2) is_admin(): hr zählt als Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
    OR EXISTS (
      SELECT 1 FROM staff
      WHERE email = (auth.jwt() ->> 'email')
        AND is_active = true
        AND roles && ARRAY['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'hr']::TEXT[]
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) is_staff_manager(): owner, chef oder hr dürfen Mitarbeiter verwalten
CREATE OR REPLACE FUNCTION is_staff_manager()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
    OR EXISTS (
      SELECT 1 FROM staff
      WHERE email = (auth.jwt() ->> 'email')
        AND is_active = true
        AND roles && ARRAY['owner', 'chef', 'hr']::TEXT[]
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4) admin_roles: Rolle "hr" anlegen (falls Tabelle existiert)
INSERT INTO admin_roles (slug, name, description, area_id, parent_role_id, permissions, is_system, sort_order)
SELECT 'hr', 'Personal / Einstellung', 'Mitarbeiter einladen, anlegen und einstellen; Rollen zuweisen (keine Owner/Chef-Vergabe); Inhaber-Konto nicht änderbar', (SELECT id FROM admin_areas WHERE slug = 'team' LIMIT 1), (SELECT id FROM admin_roles WHERE slug = 'chef' LIMIT 1), ARRAY['team:staff_manage']::TEXT[], true, 25
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_roles')
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  area_id = EXCLUDED.area_id,
  parent_role_id = EXCLUDED.parent_role_id,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();
