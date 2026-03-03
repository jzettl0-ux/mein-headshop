-- min_stock_level fuer Lager-Warnung (Inventory Intelligence)
ALTER TABLE products ADD COLUMN IF NOT EXISTS min_stock_level INTEGER DEFAULT 0;
COMMENT ON COLUMN products.min_stock_level IS 'Mindestbestand; Unterschreitung = rote Warnung im Lager-Dashboard';

-- Retouren/Gutschriften: Erstattungen fuer Finanz-Dashboard
CREATE TABLE IF NOT EXISTS refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount_eur DECIMAL(10,2) NOT NULL,
  credit_note_filename TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON refunds(created_at);
COMMENT ON TABLE refunds IS 'Gutschriften/Erstattungen; Betraege werden im Finanz-Dashboard von den Einnahmen abgezogen';
