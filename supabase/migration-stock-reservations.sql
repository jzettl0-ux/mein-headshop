-- Warenkorb-Reservierung: Bestand für eine begrenzte Zeit blockieren, solange Artikel im Warenkorb sind.
CREATE TABLE IF NOT EXISTS stock_reservations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_reservations_session ON stock_reservations(session_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_product ON stock_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_reservations_expires ON stock_reservations(expires_at);

COMMENT ON TABLE stock_reservations IS 'Temporäre Reservierung pro Warenkorb-Session; ablaufend nach z. B. 30 Min. Verfügbarer Bestand = products.stock - Summe nicht abgelaufener Reservierungen.';
