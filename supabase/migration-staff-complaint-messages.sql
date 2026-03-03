-- Chat-Thread pro Mitarbeiter-Beschwerde: Antworten von Inhaber/Chef + E-Mail-Antworten des Mitarbeiters
-- Führe NACH migration-staff-profile-and-complaints.sql aus.

CREATE TABLE IF NOT EXISTS staff_complaint_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES staff_complaints(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('owner_chef', 'staff')),
  author_email TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_staff_complaint_messages_complaint_id ON staff_complaint_messages(complaint_id);
CREATE INDEX IF NOT EXISTS idx_staff_complaint_messages_created_at ON staff_complaint_messages(created_at);

COMMENT ON TABLE staff_complaint_messages IS 'Nachrichtenverlauf pro Mitarbeiter-Beschwerde. owner_chef = Inhaber/Chef antwortet, staff = Mitarbeiter antwortet per E-Mail.';
COMMENT ON COLUMN staff_complaint_messages.author_type IS 'owner_chef = Inhaber/Chef hat geantwortet, staff = Mitarbeiter hat per E-Mail geantwortet';

-- RLS: Kein direkter Zugriff (nur über Service Role/Backend)
ALTER TABLE staff_complaint_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No direct access staff_complaint_messages" ON staff_complaint_messages;
CREATE POLICY "No direct access staff_complaint_messages"
  ON staff_complaint_messages FOR ALL
  USING (false)
  WITH CHECK (false);
