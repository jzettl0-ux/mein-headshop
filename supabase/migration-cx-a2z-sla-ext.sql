-- Blueprint Teil 6.17: A-bis-z 48h-SLA Spalten
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS initial_contact_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS vendor_sla_deadline TIMESTAMPTZ GENERATED ALWAYS AS (COALESCE(initial_contact_at, opened_at) + INTERVAL '48 hours') STORED;
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS vendor_replied_at TIMESTAMPTZ;
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS escalated_to_admin_at TIMESTAMPTZ;
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS order_line_id UUID REFERENCES fulfillment.order_lines(id) ON DELETE SET NULL;
