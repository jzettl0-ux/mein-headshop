-- Admin-Bereiche und konfigurierbare Rollen
-- Ermöglicht später: Teamleiter pro Bereich, Rollen anlegen/entfernen,
-- Zuordnung Rolle ↔ Bereich, Befugnisse, Unterstellung (parent_role_id).

-- ========== 1) Bereiche (z. B. Bestellungen, Produkte, Team) ==========
CREATE TABLE IF NOT EXISTS admin_areas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE admin_areas IS 'Admin-Bereiche für Navigation und Rollenzuordnung (z. B. Bestellungen, Produkte, Team).';
COMMENT ON COLUMN admin_areas.slug IS 'Eindeutiger Schlüssel (orders, products, team, …).';

-- ========== 2) Rollen-Definitionen (Bereich, Befugnisse, unterstellt wem) ==========
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  area_id UUID REFERENCES admin_areas(id) ON DELETE SET NULL,
  parent_role_id UUID REFERENCES admin_roles(id) ON DELETE SET NULL,
  permissions TEXT[] DEFAULT '{}',
  is_system BOOLEAN NOT NULL DEFAULT false,
  sort_order SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE admin_roles IS 'Rollen mit Bereich, Befugnissen und Unterstellung (parent_role_id). is_system = nicht löschbar.';
COMMENT ON COLUMN admin_roles.area_id IS 'Hauptbereich dieser Rolle (z. B. Teamleiter Bestellungen → area orders).';
COMMENT ON COLUMN admin_roles.parent_role_id IS 'Rolle, der diese unterstellt ist (z. B. support unterstellt chef).';
COMMENT ON COLUMN admin_roles.permissions IS 'Befugnisse z. B. orders:view, orders:edit, team:manage. Leer = aus Code abgeleitet.';
COMMENT ON COLUMN admin_roles.is_system IS 'System-Rollen (owner, chef, admin, …) dürfen nicht gelöscht werden.';

-- ========== 3) Staff: optional Unterstellung + Teamleiter-Bereich ==========
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'reports_to_id') THEN
    ALTER TABLE staff ADD COLUMN reports_to_id UUID REFERENCES staff(id) ON DELETE SET NULL;
    COMMENT ON COLUMN staff.reports_to_id IS 'Vorgesetzte/r (z. B. Teamleiter). Optional.';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'staff' AND column_name = 'lead_for_area_id') THEN
    ALTER TABLE staff ADD COLUMN lead_for_area_id UUID REFERENCES admin_areas(id) ON DELETE SET NULL;
    COMMENT ON COLUMN staff.lead_for_area_id IS 'Teamleiter für diesen Bereich (nur eine Area pro Person). Optional.';
  END IF;
END $$;

-- ========== 4) Seed: Bereiche ==========
INSERT INTO admin_areas (slug, name, description, sort_order) VALUES
  ('orders', 'Bestellungen', 'Bestellungen, Versand, Retouren', 10),
  ('products', 'Produkte & Sortiment', 'Produkte, Kategorien, Influencer, Startseite', 20),
  ('team', 'Team & Rollen', 'Mitarbeiter, Rollen, Verträge', 30),
  ('finances', 'Finanzen', 'Umsatz, Ausgaben, Finanz-Parameter', 40),
  ('support', 'Kundenservice', 'Anfragen, Beschwerden, Bewertungen', 50),
  ('inventory', 'Lager', 'Bestand, Lagerverwaltung', 60),
  ('settings', 'Einstellungen', 'Shop-Einstellungen, nur Inhaber', 70),
  ('vendors', 'Vendoren', 'Marktplatz-Verkäufer, Auszahlungen', 80),
  ('marketing', 'Marketing & Rabatte', 'Rabattcodes, Aktionen', 90)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order,
  updated_at = NOW();

-- ========== 5) Seed: Rollen (mit Bereich + Unterstellung) ==========
INSERT INTO admin_roles (slug, name, description, area_id, parent_role_id, permissions, is_system, sort_order)
VALUES
  ('owner', 'Inhaber', 'Voller Zugriff inkl. Einstellungen, Finanzen, Team', NULL, NULL, ARRAY['*']::TEXT[], true, 0),
  ('chef', 'Chef / Stellvertreter', 'Alles außer Inhaber-Funktionen; darf Team verwalten, nicht Inhaber-Konto', NULL, NULL, ARRAY['orders','products','team','support','inventory','vendors','marketing']::TEXT[], true, 10),
  ('admin', 'Shop-Administrator', 'Bestellungen, Produkte, Einkauf, Rabattcodes', NULL, NULL, ARRAY['orders','products','support','vendors','marketing']::TEXT[], true, 20),
  ('hr', 'Personal / Einstellung', 'Mitarbeiter einladen, anlegen und verwalten; keine Rollen Owner/Chef vergeben; Inhaber-Konto nicht änderbar', (SELECT id FROM admin_areas WHERE slug = 'team' LIMIT 1), NULL, ARRAY['team:staff_manage']::TEXT[], true, 25),
  ('product_care', 'Produktpflege', 'Sortiment, Influencer, Bewertungen', (SELECT id FROM admin_areas WHERE slug = 'products' LIMIT 1), NULL, ARRAY['products']::TEXT[], true, 30),
  ('support', 'Kundenservice', 'Kundenanfragen, Bestellungen einsehen', (SELECT id FROM admin_areas WHERE slug = 'orders' LIMIT 1), NULL, ARRAY['orders:view','support']::TEXT[], true, 40),
  ('employee', 'Mitarbeiter / Lager', 'Bestellungen bearbeiten, Versand', (SELECT id FROM admin_areas WHERE slug = 'orders' LIMIT 1), NULL, ARRAY['orders:view','orders:edit']::TEXT[], true, 50)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  area_id = EXCLUDED.area_id,
  permissions = EXCLUDED.permissions,
  updated_at = NOW();

-- Unterstellung: Chef → Owner, Admin → Chef, HR → Chef, Support → Chef, Employee → Support
UPDATE admin_roles SET parent_role_id = (SELECT id FROM admin_roles WHERE slug = 'owner' LIMIT 1) WHERE slug = 'chef';
UPDATE admin_roles SET parent_role_id = (SELECT id FROM admin_roles WHERE slug = 'chef' LIMIT 1) WHERE slug = 'admin';
UPDATE admin_roles SET parent_role_id = (SELECT id FROM admin_roles WHERE slug = 'chef' LIMIT 1) WHERE slug = 'hr';
UPDATE admin_roles SET parent_role_id = (SELECT id FROM admin_roles WHERE slug = 'chef' LIMIT 1) WHERE slug = 'support';
UPDATE admin_roles SET parent_role_id = (SELECT id FROM admin_roles WHERE slug = 'support' LIMIT 1) WHERE slug = 'employee';

-- ========== 6) RLS (optional: nur Service-Role schreibt) ==========
ALTER TABLE admin_areas ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;

-- Policies zuerst entfernen, damit Migration mehrfach lauffähig ist
DO $$
BEGIN
  DROP POLICY IF EXISTS "admin_areas read all" ON admin_areas;
  DROP POLICY IF EXISTS "admin_areas write service" ON admin_areas;
  DROP POLICY IF EXISTS "admin_roles read all" ON admin_roles;
  DROP POLICY IF EXISTS "admin_roles write service" ON admin_roles;
END $$;

CREATE POLICY "admin_areas read all" ON admin_areas FOR SELECT TO service_role, authenticated USING (true);
CREATE POLICY "admin_areas write service" ON admin_areas FOR ALL TO service_role USING (true) WITH CHECK (true);
CREATE POLICY "admin_roles read all" ON admin_roles FOR SELECT TO service_role, authenticated USING (true);
CREATE POLICY "admin_roles write service" ON admin_roles FOR ALL TO service_role USING (true) WITH CHECK (true);
