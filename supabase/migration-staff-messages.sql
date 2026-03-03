-- Interner Chat zwischen Mitarbeitern (1:1 Nachrichten).
-- Jede Zeile = eine Nachricht von from_staff_id an to_staff_id.

CREATE TABLE IF NOT EXISTS staff_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  from_staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  to_staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_messages_from ON staff_messages(from_staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_messages_to ON staff_messages(to_staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_messages_created ON staff_messages(created_at DESC);

COMMENT ON TABLE staff_messages IS 'Interner Chat: Nachrichten zwischen Mitarbeitern (1:1).';

ALTER TABLE staff_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "staff_messages service only" ON staff_messages
  FOR ALL TO service_role USING (true) WITH CHECK (true);
