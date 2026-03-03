-- Vendor-Inquiries: Vollständige Tabelle (Basis + Partner-Typ + Influencer-Links + BFSG)
-- Alternative zu migration-vendor-inquiries + -partner-type + -influencer-links + -bfsg-exemption.
-- Wird bei CREATE TABLE IF NOT EXISTS übersprungen, falls migration-vendor-inquiries bereits lief.
-- Dann fügen die Einzel-Migrationen die Spalten hinzu. Keine Doppelung – beide Wege sind ok.

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

  -- Partner-Typ & Erweiterungen
  partner_type TEXT DEFAULT 'company' CHECK (partner_type IN ('influencer', 'company')),
  influencer_links JSONB DEFAULT '{}',
  bfsg_micro_enterprise_exemption BOOLEAN DEFAULT false,

  -- Status
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
COMMENT ON COLUMN vendor_inquiries.partner_type IS 'influencer = Influencer/Content Creator, company = Normale Firma/Händler';
COMMENT ON COLUMN vendor_inquiries.influencer_links IS 'Social-Links bei Influencer-Anfragen: {instagram, tiktok, youtube, twitter, twitch, andere}';
COMMENT ON COLUMN vendor_inquiries.bfsg_micro_enterprise_exemption IS '§2 Nr.17 BFSG: Kleinstunternehmen (<10 MA, <2M€ Umsatz) – wird bei Genehmigung in compliance.vendor_legal_flags übernommen';

DROP TRIGGER IF EXISTS update_vendor_inquiries_updated_at ON vendor_inquiries;
CREATE TRIGGER update_vendor_inquiries_updated_at
  BEFORE UPDATE ON vendor_inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE vendor_inquiries ENABLE ROW LEVEL SECURITY;
