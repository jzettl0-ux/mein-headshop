-- Gruppen- und Teamchats: Konversationen mit mehreren Teilnehmern.
-- 1:1 bleibt über staff_messages (from_staff_id, to_staff_id, conversation_id NULL).
-- Gruppen: staff_conversations + staff_conversation_participants, Nachrichten mit conversation_id gesetzt.

CREATE TABLE IF NOT EXISTS staff_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT,
  is_group BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE staff_conversations IS 'Gruppen-/Teamchats. name nur bei is_group gesetzt.';

CREATE TABLE IF NOT EXISTS staff_conversation_participants (
  conversation_id UUID NOT NULL REFERENCES staff_conversations(id) ON DELETE CASCADE,
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  PRIMARY KEY (conversation_id, staff_id)
);

CREATE INDEX IF NOT EXISTS idx_staff_conv_participants_staff ON staff_conversation_participants(staff_id);

-- Nachrichten: entweder 1:1 (conversation_id NULL, to_staff_id gesetzt) oder Gruppe (conversation_id gesetzt, to_staff_id NULL)
ALTER TABLE staff_messages
  ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES staff_conversations(id) ON DELETE CASCADE;

ALTER TABLE staff_messages
  ALTER COLUMN to_staff_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_staff_messages_conversation ON staff_messages(conversation_id) WHERE conversation_id IS NOT NULL;

COMMENT ON COLUMN staff_messages.conversation_id IS 'Bei Gruppenchat: Nachricht gehört zu dieser Konversation; to_staff_id ist dann NULL.';

ALTER TABLE staff_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_conversation_participants ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  DROP POLICY IF EXISTS "staff_conversations service only" ON staff_conversations;
  CREATE POLICY "staff_conversations service only" ON staff_conversations FOR ALL TO service_role USING (true) WITH CHECK (true);

  DROP POLICY IF EXISTS "staff_conversation_participants service only" ON staff_conversation_participants;
  CREATE POLICY "staff_conversation_participants service only" ON staff_conversation_participants FOR ALL TO service_role USING (true) WITH CHECK (true);
END $$;
