-- ============================================
-- Phase 2: Vendors + KYB (Marktplatz Blueprint)
-- ============================================
-- Vendors sind Verkäufer im Multi-Vendor-Marktplatz.
-- KYB = Know Your Business (4-stufiger Onboarding-Workflow)

-- vendor_accounts: Stammdaten der Verkäufer
CREATE TABLE IF NOT EXISTS vendor_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  -- Anbindung an Auth (später: eigener Login für Vendor-Portal)
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

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

  -- KYB-Status: draft → submitted → documents_review → approved | rejected
  kyb_status TEXT DEFAULT 'draft' CHECK (kyb_status IN (
    'draft', 'submitted', 'documents_review', 'approved', 'rejected', 'suspended'
  )),
  kyb_rejection_reason TEXT,
  kyb_approved_at TIMESTAMP WITH TIME ZONE,
  kyb_approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  -- Bankverbindung (für spätere Gutschriften/Auszahlungen)
  bank_iban TEXT,
  bank_bic TEXT,
  bank_holder TEXT,

  -- Metadaten
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_accounts_kyb_status ON vendor_accounts(kyb_status);
CREATE INDEX IF NOT EXISTS idx_vendor_accounts_user_id ON vendor_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_accounts_vat_id ON vendor_accounts(vat_id) WHERE vat_id IS NOT NULL;

COMMENT ON TABLE vendor_accounts IS 'Verkäufer-Konten im Marktplatz; KYB-Onboarding für Compliance';

-- vendor_ubos: Ultimate Beneficial Owners (wirtschaftliche Eigentümer, § 3 GwG)
CREATE TABLE IF NOT EXISTS vendor_ubos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,

  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,
  role TEXT,
  share_percent DECIMAL(5,2),

  -- PEP/Sanctions-Screening (Phase 4)
  pep_screening_status TEXT DEFAULT 'pending' CHECK (pep_screening_status IN ('pending', 'passed', 'flagged', 'manual_review')),
  sanctions_screening_status TEXT DEFAULT 'pending' CHECK (sanctions_screening_status IN ('pending', 'passed', 'flagged', 'manual_review')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_ubos_vendor ON vendor_ubos(vendor_id);
COMMENT ON TABLE vendor_ubos IS 'UBOs gemäß § 3 GwG; für PEP/Sanctions-Screening';

-- vendor_kyb_documents: Hochgeladene Dokumente (Handelsregister, USt-Bescheinigung, etc.)
CREATE TABLE IF NOT EXISTS vendor_kyb_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,

  document_type TEXT NOT NULL CHECK (document_type IN (
    'handelsregister', 'ust_bescheinigung', 'id_pass', 'id_id_card',
    'company_extract', 'other'
  )),
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  mime_type TEXT,

  -- Review (Maker-Checker)
  review_status TEXT DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected')),
  review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vendor_kyb_docs_vendor ON vendor_kyb_documents(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_kyb_docs_type ON vendor_kyb_documents(document_type);
COMMENT ON TABLE vendor_kyb_documents IS 'KYB-Dokumente für manuelles Review';

-- vendor_offers: Angebote pro Produkt ( mehrere Vendoren können dasselbe Produkt anbieten )
CREATE TABLE IF NOT EXISTS vendor_offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,

  price DECIMAL(10,2) NOT NULL,
  stock INTEGER DEFAULT 0,
  sku TEXT,

  -- Fulfillment: fbm = Fulfillment by Merchant (Vendor versendet selbst), fba = FBA (wenn später)
  fulfillment_type TEXT DEFAULT 'fbm' CHECK (fulfillment_type IN ('fbm', 'fba')),

  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(vendor_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_vendor_offers_vendor ON vendor_offers(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_offers_product ON vendor_offers(product_id);
CREATE INDEX IF NOT EXISTS idx_vendor_offers_active ON vendor_offers(is_active) WHERE is_active = true;
COMMENT ON TABLE vendor_offers IS 'Angebote: Vendor × Produkt mit Preis/Lager; Basis für Buy Box';

-- updated_at Trigger für neue Tabellen
CREATE TRIGGER update_vendor_accounts_updated_at
  BEFORE UPDATE ON vendor_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_ubos_updated_at
  BEFORE UPDATE ON vendor_ubos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendor_offers_updated_at
  BEFORE UPDATE ON vendor_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS (nur Admin-Zugriff via Service Role; Row-Level für späteres Vendor-Portal)
ALTER TABLE vendor_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_ubos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_kyb_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_offers ENABLE ROW LEVEL SECURITY;

-- Admin/Service-Role greift immer zu (RLS wird in API mit Service-Role umgangen)
-- Platzhalter-Policies: Vendors sehen nur eigene Daten (wenn user_id gesetzt)
CREATE POLICY "Vendor can view own account"
  ON vendor_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Vendor can view own ubos"
  ON vendor_ubos FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM vendor_accounts va WHERE va.id = vendor_id AND va.user_id = auth.uid())
  );

CREATE POLICY "Vendor can view own documents"
  ON vendor_kyb_documents FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM vendor_accounts va WHERE va.id = vendor_id AND va.user_id = auth.uid())
  );

CREATE POLICY "Vendor can view own offers"
  ON vendor_offers FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM vendor_accounts va WHERE va.id = vendor_id AND va.user_id = auth.uid())
  );

-- Storage-Bucket für KYB-Dokumente (privat)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-kyb-documents', 'vendor-kyb-documents', false)
ON CONFLICT (id) DO NOTHING;
