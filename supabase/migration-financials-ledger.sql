-- ============================================
-- Phase 1.4: Financials Ledger (Blueprint 7.3)
-- ============================================
-- Transaktions-Ledger (Doppelte Buchführung), Rechnungen, Self-Billing Gutschriften §14 UStG

CREATE SCHEMA IF NOT EXISTS financials;

-- Globales Transaktions-Ledger (Double-Entry Bookkeeping)
CREATE TABLE IF NOT EXISTS financials.ledger (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  transaction_type VARCHAR(50) NOT NULL CHECK (transaction_type IN (
    'SALE', 'REFUND', 'COMMISSION_FEE', 'FBA_FEE', 'PAYOUT', 'SHIPPING_FEE', 'TAX'
  )),
  amount NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  tax_amount NUMERIC(12, 2) DEFAULT 0.00,
  is_deemed_supplier BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE financials.ledger IS 'Transaktions-Ledger für Multi-Vendor. SALE=Umsatz, COMMISSION_FEE=Marktplatzprovision, PAYOUT=Auszahlung an Vendor.';
COMMENT ON COLUMN financials.ledger.is_deemed_supplier IS 'EU-VAT Plattformfiktion (Deemed Seller Rule)';

CREATE INDEX IF NOT EXISTS idx_ledger_order ON financials.ledger(order_id);
CREATE INDEX IF NOT EXISTS idx_ledger_vendor ON financials.ledger(vendor_id);
CREATE INDEX IF NOT EXISTS idx_ledger_created ON financials.ledger(created_at);
CREATE INDEX IF NOT EXISTS idx_ledger_type ON financials.ledger(transaction_type);

-- Rechnungen und Self-Billing Gutschriften (§14 UStG)
CREATE TABLE IF NOT EXISTS financials.invoices (
  invoice_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID REFERENCES financials.ledger(transaction_id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  document_type VARCHAR(50) NOT NULL CHECK (document_type IN (
    'CUSTOMER_INVOICE', 'SELF_BILLING_CREDIT_NOTE'
  )),
  seller_vat_id VARCHAR(50),
  buyer_vat_id VARCHAR(50),
  net_amount NUMERIC(12, 2) NOT NULL,
  tax_rate NUMERIC(4, 2) NOT NULL,
  gross_amount NUMERIC(12, 2) NOT NULL,
  issued_date DATE NOT NULL DEFAULT CURRENT_DATE,
  e_invoice_xml_url VARCHAR(500),
  pdf_url VARCHAR(500),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE financials.invoices IS 'Kundenrechnungen + Self-Billing Gutschriften an Vendoren (§14 UStG)';
COMMENT ON COLUMN financials.invoices.document_type IS 'CUSTOMER_INVOICE=Kunde, SELF_BILLING_CREDIT_NOTE=Gutschrift an Vendor';
COMMENT ON COLUMN financials.invoices.e_invoice_xml_url IS 'XRechnung/ZUGFeRD (E-Rechnung 2025)';

CREATE INDEX IF NOT EXISTS idx_invoices_vendor ON financials.invoices(vendor_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order ON financials.invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_issued ON financials.invoices(issued_date);
CREATE INDEX IF NOT EXISTS idx_invoices_document_type ON financials.invoices(document_type);

-- Sequenz für Gutschriften-Nummern (§14 UStG: sequenziell)
CREATE SEQUENCE IF NOT EXISTS financials.self_billing_credit_note_seq START 1;

COMMENT ON SEQUENCE financials.self_billing_credit_note_seq IS 'Sequenzielle Nummer für Self-Billing Gutschriften';

-- RLS (Admin/Service-Role only)
ALTER TABLE financials.ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE financials.invoices ENABLE ROW LEVEL SECURITY;
