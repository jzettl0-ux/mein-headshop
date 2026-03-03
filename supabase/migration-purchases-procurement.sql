-- ============================================
-- Procurement & Expense Management: Einkäufe mit Positionen
-- ============================================

CREATE TABLE IF NOT EXISTS purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  invoice_number TEXT,
  invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
  type TEXT NOT NULL DEFAULT 'wareneinkauf' CHECK (type IN ('wareneinkauf', 'betriebsmittel')),
  total_eur DECIMAL(12,2) NOT NULL DEFAULT 0,
  invoice_pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE purchases IS 'Einkäufe: Wareneinkauf (COGS) oder Betriebsmittel (OPEX)';
COMMENT ON COLUMN purchases.type IS 'wareneinkauf = COGS, betriebsmittel = OPEX';
COMMENT ON COLUMN purchases.invoice_pdf_url IS 'URL des Rechnungs-PDFs (Storage expense-invoices)';

CREATE TABLE IF NOT EXISTS purchase_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  purchase_id UUID NOT NULL REFERENCES purchases(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  quantity DECIMAL(12,3) NOT NULL DEFAULT 1,
  unit_price_eur DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_eur DECIMAL(12,2) NOT NULL DEFAULT 0,
  sort_order INTEGER DEFAULT 0
);

COMMENT ON TABLE purchase_items IS 'Positionen eines Einkaufs: Produkt (für Lagererhöhung) oder Freitext';
COMMENT ON COLUMN purchase_items.product_id IS 'Wenn gesetzt: Lagerbestand wird um quantity erhöht';
COMMENT ON COLUMN purchase_items.description IS 'Produktname oder Freitext (z.B. 1000x Versandkartons)';

CREATE INDEX IF NOT EXISTS idx_purchases_supplier ON purchases(supplier_id);
CREATE INDEX IF NOT EXISTS idx_purchases_date ON purchases(invoice_date);
CREATE INDEX IF NOT EXISTS idx_purchases_type ON purchases(type);
CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
CREATE INDEX IF NOT EXISTS idx_purchase_items_product ON purchase_items(product_id);
