-- Phase 11.4: Customer Q&A (Fragen & Antworten auf PDP)
-- advanced_ops.product_qa: UGC, SEO, strukturierte Q&A-Inhalte

CREATE SCHEMA IF NOT EXISTS advanced_ops;

CREATE TABLE IF NOT EXISTS advanced_ops.product_qa (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT,
  asked_by_name TEXT,
  asked_by_email TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'answered', 'hidden')),
  answered_at TIMESTAMPTZ,
  answered_by TEXT CHECK (answered_by IS NULL OR answered_by IN ('seller', 'customer')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_qa_product ON advanced_ops.product_qa(product_id);
CREATE INDEX IF NOT EXISTS idx_product_qa_status ON advanced_ops.product_qa(product_id, status) WHERE status IN ('pending', 'answered');

COMMENT ON TABLE advanced_ops.product_qa IS 'Phase 11.4: Kundenfragen & Antworten auf PDP – UGC, SEO';
COMMENT ON COLUMN advanced_ops.product_qa.answered_by IS 'seller = Händlerantwort, customer = Kundenantwort';

ALTER TABLE advanced_ops.product_qa ENABLE ROW LEVEL SECURITY;
