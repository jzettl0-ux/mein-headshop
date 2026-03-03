-- A-bis-z 48h-SLA Spalten (ohne fulfillment.order_lines – für Einzel-Shops)
-- Wenn fulfillment.order_lines existiert, stattdessen migration-cx-a2z-sla-ext.sql nutzen (enthält zusätzlich order_line_id).
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS initial_contact_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS vendor_sla_deadline TIMESTAMPTZ GENERATED ALWAYS AS (COALESCE(initial_contact_at, opened_at) + INTERVAL '48 hours') STORED;
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS vendor_replied_at TIMESTAMPTZ;
ALTER TABLE cx.a_to_z_claims ADD COLUMN IF NOT EXISTS escalated_to_admin_at TIMESTAMPTZ;
