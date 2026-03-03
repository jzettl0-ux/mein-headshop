-- Phase 8cx.5: Vine-Programm (Produkttester, kostenlose Muster)
-- cx.vine_products: Produkte im Tester-Programm
-- cx.vine_invitations: Einladungen an Tester (kostenloses Muster + verpflichtendes Review)

CREATE TABLE IF NOT EXISTS cx.vine_products (
  product_id UUID PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  max_testers INT NOT NULL DEFAULT 5,
  status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'PAUSED', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vine_products_status ON cx.vine_products(status) WHERE status = 'ACTIVE';

CREATE TABLE IF NOT EXISTS cx.vine_invitations (
  invitation_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  tester_email TEXT NOT NULL,
  status TEXT DEFAULT 'invited' CHECK (status IN ('invited', 'accepted', 'declined', 'sample_shipped', 'review_pending', 'completed')),
  sample_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  shipped_at TIMESTAMPTZ,
  token TEXT UNIQUE,
  invited_at TIMESTAMPTZ DEFAULT now(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_vine_invitations_product ON cx.vine_invitations(product_id);
CREATE INDEX IF NOT EXISTS idx_vine_invitations_token ON cx.vine_invitations(token) WHERE token IS NOT NULL;

COMMENT ON TABLE cx.vine_invitations IS 'Produkttester-Einladungen. Tester erhält kostenloses Muster und muss Review schreiben (is_tester_program=true).';

ALTER TABLE cx.vine_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE cx.vine_invitations ENABLE ROW LEVEL SECURITY;
