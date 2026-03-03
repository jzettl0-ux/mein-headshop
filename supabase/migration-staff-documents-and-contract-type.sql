-- ============================================
-- 1) contract_templates: Vertragstyp (Mitarbeiter / Verkäufer / …)
-- 2) staff_documents: Gescannte/hochgeladene Verträge pro Mitarbeiter
-- ============================================

-- contract_type für Filter (Mitarbeiterverträge vs. Verkäufer/Lieferant)
ALTER TABLE contract_templates ADD COLUMN IF NOT EXISTS contract_type TEXT;
COMMENT ON COLUMN contract_templates.contract_type IS 'employee = Mitarbeitervertrag, vendor = Verkäufer/Lieferant, null = Sonstige';

UPDATE contract_templates SET contract_type = 'employee' WHERE slug = 'mitarbeiter' AND (contract_type IS NULL OR contract_type = '');
UPDATE contract_templates SET contract_type = 'vendor' WHERE slug = 'verkaeufer-vendor' AND (contract_type IS NULL OR contract_type = '');

-- staff_documents: Anhänge pro Mitarbeiter (z. B. eingescannte unterschriebene Verträge)
CREATE TABLE IF NOT EXISTS staff_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL DEFAULT 'signed_contract'
    CHECK (document_type IN ('signed_contract', 'id_document', 'other')),
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_documents_staff ON staff_documents(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_documents_created ON staff_documents(created_at DESC);
COMMENT ON TABLE staff_documents IS 'Dokumente pro Mitarbeiter (z. B. eingescannte unterschriebene Arbeitsverträge)';

ALTER TABLE staff_documents ENABLE ROW LEVEL SECURITY;

-- Zugriff nur über Service Role (Admin-API)
DROP POLICY IF EXISTS "Staff documents service role only" ON staff_documents;
CREATE POLICY "Staff documents service role only"
  ON staff_documents FOR ALL
  USING (false)
  WITH CHECK (false);

-- Storage-Bucket für Mitarbeiter-Dokumente (privat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('staff-documents', 'staff-documents', false)
ON CONFLICT (id) DO NOTHING;
