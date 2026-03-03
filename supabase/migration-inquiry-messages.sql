-- Chat-Thread pro Anfrage: mehrere Nachrichten (Kunde, Team, Kunde, …)
-- Führe NACH migration-customer-inquiries.sql aus.

CREATE TABLE IF NOT EXISTS inquiry_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inquiry_id UUID NOT NULL REFERENCES customer_inquiries(id) ON DELETE CASCADE,
  author_type TEXT NOT NULL CHECK (author_type IN ('customer', 'staff')),
  author_email TEXT,
  author_name TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inquiry_messages_inquiry_id ON inquiry_messages(inquiry_id);
CREATE INDEX IF NOT EXISTS idx_inquiry_messages_created_at ON inquiry_messages(created_at);

COMMENT ON TABLE inquiry_messages IS 'Nachrichtenverlauf pro Kundenanfrage (Chat-Thread).';
COMMENT ON COLUMN inquiry_messages.author_type IS 'customer = Kunde hat geschrieben, staff = Mitarbeiter hat geantwortet';

ALTER TABLE inquiry_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view inquiry_messages" ON inquiry_messages;
CREATE POLICY "Admins can view inquiry_messages"
  ON inquiry_messages FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can insert inquiry_messages" ON inquiry_messages;
CREATE POLICY "Admins can insert inquiry_messages"
  ON inquiry_messages FOR INSERT
  WITH CHECK (is_admin());

-- Backend (Service Role) braucht vollen Zugriff für Webhook/API
-- RLS mit is_admin() reicht, da API mit Service Role arbeitet und is_admin() den Session-User prüft.
-- Bei Webhook gibt es keinen Session-User – Webhook-Route muss Service Role nutzen und direkt inserten.
