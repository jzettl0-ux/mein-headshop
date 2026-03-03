-- ============================================
-- Startseite: Kategorien "Was suchst du?" + Anzahl Influencer
-- ============================================

-- Tabelle: Kategorien für die Startseite (anpassbar, mit eigenem Bild)
CREATE TABLE IF NOT EXISTS homepage_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  gradient TEXT DEFAULT 'from-luxe-gold/20 to-yellow-500/20',
  icon_color TEXT DEFAULT 'text-luxe-gold',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(slug)
);

-- Default-Kategorien (wie bisher im Code)
INSERT INTO homepage_categories (name, slug, description, gradient, icon_color, sort_order) VALUES
  ('Bongs', 'bongs', 'Premium Glasbongs', 'from-purple-500/20 to-pink-500/20', 'text-purple-400', 0),
  ('Grinder', 'grinder', 'Hochwertige Grinder', 'from-luxe-gold/20 to-yellow-500/20', 'text-luxe-gold', 1),
  ('Papers', 'papers', 'Premium Papers', 'from-blue-500/20 to-cyan-500/20', 'text-blue-400', 2),
  ('Vaporizer', 'vaporizer', 'High-Tech Vaporizer', 'from-luxe-neon/20 to-green-500/20', 'text-luxe-neon', 3)
ON CONFLICT (slug) DO NOTHING;

-- Einstellung: Wie viele Influencer auf der Startseite anzeigen (Default 6)
INSERT INTO site_settings (key, value) VALUES ('homepage_influencer_limit', '6')
ON CONFLICT (key) DO NOTHING;

-- RLS
ALTER TABLE homepage_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Homepage categories are viewable by everyone"
  ON homepage_categories FOR SELECT USING (true);

CREATE POLICY "Admin can manage homepage categories"
  ON homepage_categories FOR ALL
  USING ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com')
  WITH CHECK ((SELECT auth.jwt() ->> 'email') = 'jzettl0@gmail.com');
