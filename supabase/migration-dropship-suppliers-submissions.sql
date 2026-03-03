-- ============================================
-- Dropshipping: Lieferanten-Typ (email/api) + Übermittlungs-Status
-- ============================================

-- suppliers: Typ und API-Felder für Dropship-Benachrichtigung
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS type TEXT CHECK (type IN ('email', 'api')) DEFAULT 'email';
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS api_endpoint TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS api_key TEXT;
COMMENT ON COLUMN suppliers.type IS 'email = Bestellung per E-Mail an Lieferant, api = Übermittlung per API (MockInfluencerConnector)';
COMMENT ON COLUMN suppliers.api_endpoint IS 'API-URL für Bestellübermittlung (bei type=api)';
COMMENT ON COLUMN suppliers.api_key IS 'API-Key für Authentifizierung (bei type=api)';

-- Protokoll: Welche Bestellungen wurden an welche Lieferanten übermittelt?
CREATE TABLE IF NOT EXISTS order_supplier_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  method TEXT NOT NULL CHECK (method IN ('email', 'api')),
  UNIQUE(order_id, supplier_id)
);
CREATE INDEX IF NOT EXISTS idx_order_supplier_submissions_order ON order_supplier_submissions(order_id);
CREATE INDEX IF NOT EXISTS idx_order_supplier_submissions_supplier ON order_supplier_submissions(supplier_id);
COMMENT ON TABLE order_supplier_submissions IS 'Dropshipping: Bestellung wurde an Lieferant übermittelt (E-Mail oder API)';
