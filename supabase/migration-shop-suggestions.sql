-- ============================================
-- SHOP-VORSCHLÄGE
-- Kunden/Verkäufer können Verbesserungsvorschläge einreichen
-- (z.B. neue Kategorie, Features, allgemeine Ideen)
-- Admin kann Vorschläge prüfen, umsetzen und verknüpfen
-- ============================================

CREATE TABLE IF NOT EXISTS shop_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('category', 'feature', 'improvement', 'design', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  submitted_by_name TEXT NOT NULL,
  submitted_by_email TEXT,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'in_progress', 'implemented', 'rejected')),
  admin_notes TEXT,
  linked_id UUID,
  linked_type TEXT CHECK (linked_type IN ('category', 'subcategory', 'product', 'page', 'other')),
  implemented_at TIMESTAMPTZ,
  implemented_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shop_suggestions_status ON shop_suggestions(status);
CREATE INDEX IF NOT EXISTS idx_shop_suggestions_type ON shop_suggestions(suggestion_type);
CREATE INDEX IF NOT EXISTS idx_shop_suggestions_created ON shop_suggestions(created_at DESC);

COMMENT ON TABLE shop_suggestions IS 'Verbesserungsvorschläge von Kunden/Verkäufern (z.B. neue Kategorie, Feature-Ideen)';
COMMENT ON COLUMN shop_suggestions.suggestion_type IS 'Kategorie der Anfrage: category, feature, improvement, design, other';
COMMENT ON COLUMN shop_suggestions.linked_id IS 'Verknüpfung nach Umsetzung (z.B. product_category.id)';
COMMENT ON COLUMN shop_suggestions.linked_type IS 'Art der Verknüpfung nach Umsetzung';

-- RLS: INSERT öffentlich (über API mit Service Role). SELECT/UPDATE nur Admins.
ALTER TABLE shop_suggestions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view suggestions" ON shop_suggestions;
CREATE POLICY "Admins can view suggestions"
  ON shop_suggestions FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update suggestions" ON shop_suggestions;
CREATE POLICY "Admins can update suggestions"
  ON shop_suggestions FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- INSERT: Öffentlich nicht – API nutzt Service Role
DROP POLICY IF EXISTS "Allow insert for authenticated" ON shop_suggestions;
-- Keine Policy für INSERT = nur Service Role kann einfügen (Kontaktformular-Pattern)
