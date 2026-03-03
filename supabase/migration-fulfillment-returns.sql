-- Phase 10.3: Druckerlose QR-Retouren (DHL Returns API)
-- fulfillment.returns: DHL Retouren-QR-Code, RET-Nummer

CREATE SCHEMA IF NOT EXISTS fulfillment;

CREATE TABLE IF NOT EXISTS fulfillment.returns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  dhl_shipment_number VARCHAR(32),
  ret_number VARCHAR(40) NOT NULL,
  qr_label_base64 TEXT,
  pdf_label_base64 TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_fulfillment_returns_order ON fulfillment.returns(order_id);
COMMENT ON TABLE fulfillment.returns IS 'DHL druckerlose Retoure: QR-Code (base64 PNG) und RET-Nummer für Kundenabgabe bei DHL';

ALTER TABLE fulfillment.returns ENABLE ROW LEVEL SECURITY;
