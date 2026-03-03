-- Erweiterung: recall_customer_notifications unterstützt auch Gast-Bestellungen (customer_email)

ALTER TABLE compliance.recall_customer_notifications
  ALTER COLUMN customer_id DROP NOT NULL;

ALTER TABLE compliance.recall_customer_notifications
  ADD COLUMN IF NOT EXISTS customer_email TEXT;

COMMENT ON COLUMN compliance.recall_customer_notifications.customer_email IS 'Bei Gast-Checkout: E-Mail des Kunden';

-- Eindeutigkeit: pro Rückruf + Bestellung nur eine Benachrichtigung
CREATE UNIQUE INDEX IF NOT EXISTS idx_recall_notifications_recall_order
  ON compliance.recall_customer_notifications(recall_id, order_id)
  WHERE order_id IS NOT NULL;
