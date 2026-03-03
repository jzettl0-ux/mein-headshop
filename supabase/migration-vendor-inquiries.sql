-- Vendor-Anfragen: Öffentliches Formular für Partner-Anfragen
-- Beim Bearbeiten/Anlegen im Admin werden Daten in vendor_accounts übernommen

CREATE TABLE IF NOT EXISTS vendor_inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Firmenstammdaten
  company_name TEXT NOT NULL,
  legal_form TEXT,
  registration_number TEXT,
  vat_id TEXT,
  tax_number TEXT,

  -- Adresse
  address_street TEXT,
  address_zip TEXT,
  address_city TEXT,
  address_country TEXT DEFAULT 'DE',

  -- Kontakt
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  contact_person TEXT,

  -- Zusätzliche Infos vom Bewerber
  message TEXT,
  product_interest TEXT,

  -- Status: pending → approved (Vendor angelegt) | rejected
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_status ON vendor_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_vendor_inquiries_created_at ON vendor_inquiries(created_at DESC);

COMMENT ON TABLE vendor_inquiries IS 'Partner-/Vendor-Anfragen aus öffentlichem Formular; bei Genehmigung Übertrag in vendor_accounts';

CREATE TRIGGER update_vendor_inquiries_updated_at
  BEFORE UPDATE ON vendor_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE vendor_inquiries ENABLE ROW LEVEL SECURITY;
