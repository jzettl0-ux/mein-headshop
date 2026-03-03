-- ============================================
-- Blueprint 3.3: Product Recall Management (Kill-Switch)
-- ============================================

-- compliance Schema existiert

CREATE TABLE IF NOT EXISTS compliance.product_recalls (
  recall_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  asin VARCHAR(15),
  recall_reason TEXT NOT NULL,
  regulatory_authority VARCHAR(100),
  public_announcement_url VARCHAR(500),
  action_required VARCHAR(50) CHECK (action_required IN ('DESTROY', 'RETURN_TO_VENDOR', 'SOFTWARE_UPDATE')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_product_recalls_product ON compliance.product_recalls(product_id);
CREATE INDEX IF NOT EXISTS idx_product_recalls_active ON compliance.product_recalls(is_active) WHERE is_active = TRUE;

-- Benachrichtigte Kunden (Audit)
CREATE TABLE IF NOT EXISTS compliance.recall_customer_notifications (
  notification_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recall_id UUID NOT NULL REFERENCES compliance.product_recalls(recall_id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  order_item_id UUID REFERENCES order_items(id) ON DELETE SET NULL,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  refund_issued BOOLEAN DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_recall_notifications_recall ON compliance.recall_customer_notifications(recall_id);

COMMENT ON TABLE compliance.product_recalls IS 'Rückrufe: Sofortige Katalog-Sperre, Logistik-Stopp, Kunden-Warnung';

ALTER TABLE compliance.product_recalls ENABLE ROW LEVEL SECURITY;
ALTER TABLE compliance.recall_customer_notifications ENABLE ROW LEVEL SECURITY;
