-- Mollie-Webhook-Aufrufe protokollieren (Zahlungsstatus, Bestellnummer, Rohbody)
CREATE TABLE IF NOT EXISTS mollie_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id TEXT,
  order_number TEXT,
  mollie_status TEXT,
  request_body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_mollie_webhook_log_created_at ON mollie_webhook_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mollie_webhook_log_order_number ON mollie_webhook_log(order_number) WHERE order_number IS NOT NULL;

COMMENT ON TABLE mollie_webhook_log IS 'Protokoll aller Mollie-Webhook-POSTs (Payment-Status, Bestellnummer, Rohbody gekürzt)';
