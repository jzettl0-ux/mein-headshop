-- Kundenservice: Kundenanfragen (Kontaktformular)
CREATE TABLE IF NOT EXISTS customer_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'answered', 'closed')),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  replied_at TIMESTAMPTZ,
  replied_by TEXT,
  reply_text TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_inquiries_status ON customer_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_customer_inquiries_created_at ON customer_inquiries(created_at DESC);

COMMENT ON TABLE customer_inquiries IS 'Kundenanfragen aus Kontaktformular; Bearbeitung im Admin Kundenservice.';

-- RLS: Öffentlich darf niemand lesen. Nur Admins (is_admin) dürfen lesen/aktualisieren.
-- INSERT erfolgt über API mit Service Role (Kontaktformular).
ALTER TABLE customer_inquiries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view inquiries" ON customer_inquiries;
CREATE POLICY "Admins can view inquiries"
  ON customer_inquiries FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update inquiries" ON customer_inquiries;
CREATE POLICY "Admins can update inquiries"
  ON customer_inquiries FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- Kein öffentliches INSERT (Kontaktformular nutzt Backend/Service Role)
DROP POLICY IF EXISTS "Admins can insert inquiries" ON customer_inquiries;
CREATE POLICY "Admins can insert inquiries"
  ON customer_inquiries FOR INSERT
  WITH CHECK (is_admin());
