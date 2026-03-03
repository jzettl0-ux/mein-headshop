-- Zusätzliche Rollen für Teamleiter, Lagerleitung und Marketing.
-- team_leader: Teamleiter für einen Bereich (lead_for_area_id), unterstellt Chef; Bestellungen + Kundenservice.
-- warehouse_lead: Lagerleitung; Lager + Bestellungen.
-- marketing: Nur Marketing (Rabattcodes, Newsletter, Werbung).

-- 1) staff.roles: neue Slugs erlauben
ALTER TABLE staff DROP CONSTRAINT IF EXISTS staff_roles_check;
ALTER TABLE staff ADD CONSTRAINT staff_roles_check CHECK (
  array_length(roles, 1) >= 1
  AND roles <@ ARRAY['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'hr', 'team_leader', 'warehouse_lead', 'marketing']::TEXT[]
);

-- 2) is_admin(): neue Rollen zählen als Admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    (auth.jwt() ->> 'email') = 'jzettl0@gmail.com'
    OR EXISTS (
      SELECT 1 FROM staff
      WHERE email = (auth.jwt() ->> 'email')
        AND is_active = true
        AND roles && ARRAY['owner', 'chef', 'admin', 'product_care', 'support', 'employee', 'hr', 'team_leader', 'warehouse_lead', 'marketing']::TEXT[]
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3) admin_roles: neue Rollen anlegen (falls Tabelle existiert)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'admin_roles') THEN
    INSERT INTO admin_roles (slug, name, description, area_id, parent_role_id, permissions, is_system, sort_order)
    VALUES
      ('team_leader', 'Teamleiter', 'Teamleiter für einen Bereich (z. B. Bestellungen, Support); Bestellungen und Kundenservice; unterstellt Chef', (SELECT id FROM admin_areas WHERE slug = 'orders' LIMIT 1), (SELECT id FROM admin_roles WHERE slug = 'chef' LIMIT 1), ARRAY['orders','support']::TEXT[], true, 35),
      ('warehouse_lead', 'Lagerleitung', 'Lager, Bestellungen, Versand; unterstellt Chef', (SELECT id FROM admin_areas WHERE slug = 'inventory' LIMIT 1), (SELECT id FROM admin_roles WHERE slug = 'chef' LIMIT 1), ARRAY['orders','inventory']::TEXT[], true, 45),
      ('marketing', 'Marketing', 'Rabattcodes, Newsletter, Werbung; unterstellt Chef', (SELECT id FROM admin_areas WHERE slug = 'marketing' LIMIT 1), (SELECT id FROM admin_roles WHERE slug = 'chef' LIMIT 1), ARRAY['marketing']::TEXT[], true, 55)
    ON CONFLICT (slug) DO UPDATE SET
      name = EXCLUDED.name,
      description = EXCLUDED.description,
      area_id = EXCLUDED.area_id,
      parent_role_id = EXCLUDED.parent_role_id,
      permissions = EXCLUDED.permissions,
      updated_at = NOW();
  END IF;
END $$;
