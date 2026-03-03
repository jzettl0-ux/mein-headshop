-- Phase 11.1: Return Inspections & Restocking Fees
-- advanced_ops.return_inspections: Prüfung eingehender Retouren, Restocking Fee, Guided Refund Workflow

CREATE SCHEMA IF NOT EXISTS advanced_ops;

CREATE TABLE IF NOT EXISTS advanced_ops.return_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL UNIQUE REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL DEFAULT 'received'
    CHECK (status IN ('received', 'inspecting', 'inspected')),
  condition_code VARCHAR(30)
    CHECK (condition_code IS NULL OR condition_code IN ('as_new', 'minor_damage', 'major_damage', 'not_restockable')),
  restocking_fee_cents INTEGER NOT NULL DEFAULT 0 CHECK (restocking_fee_cents >= 0),
  notes TEXT,
  received_at TIMESTAMPTZ DEFAULT now(),
  inspected_at TIMESTAMPTZ,
  inspected_by_email TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_return_inspections_order ON advanced_ops.return_inspections(order_id);
CREATE INDEX IF NOT EXISTS idx_return_inspections_status ON advanced_ops.return_inspections(status) WHERE status IN ('received', 'inspecting');

COMMENT ON TABLE advanced_ops.return_inspections IS 'Phase 11.1: Retourenprüfung – Zustand, Restocking Fee, Guided Refund Workflow';
COMMENT ON COLUMN advanced_ops.return_inspections.condition_code IS 'as_new, minor_damage, major_damage, not_restockable';
COMMENT ON COLUMN advanced_ops.return_inspections.restocking_fee_cents IS 'Bearbeitungsgebühr in Cent (z.B. 500 = 5€), wird von Erstattung abgezogen';

ALTER TABLE advanced_ops.return_inspections ENABLE ROW LEVEL SECURITY;
