-- ============================================
-- API-Connector-System: Lieferanten + Integrationen
-- ============================================

-- Lieferanten (Business-Logik)
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  api_capable BOOLEAN DEFAULT false,
  connector_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE suppliers IS 'Lieferanten/Partner; api_capable = hat Schnittstelle, connector_type = z. B. influencer_api';

-- Integrationen (API-Endpoints, Keys, Sync-Intervalle)
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  connector_type TEXT NOT NULL,
  api_endpoint TEXT NOT NULL,
  api_key TEXT,
  sync_interval_minutes INTEGER DEFAULT 60,
  is_active BOOLEAN DEFAULT true,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  last_sync_status TEXT CHECK (last_sync_status IN ('success', 'error', 'pending')),
  last_sync_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE integrations IS 'Externe Schnittstellen: Endpoint, Key, Intervall; Sync-Status für Dashboard';

CREATE INDEX IF NOT EXISTS idx_integrations_active ON integrations(is_active);
CREATE INDEX IF NOT EXISTS idx_integrations_connector_type ON integrations(connector_type);

-- Produkte: Verknüpfung mit Lieferant + Integration für Sync
ALTER TABLE products ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS external_id TEXT;

COMMENT ON COLUMN products.supplier_id IS 'Lieferant (Business)';
COMMENT ON COLUMN products.integration_id IS 'Integration, über die das Produkt synchronisiert wurde';
COMMENT ON COLUMN products.external_id IS 'ID des Produkts in der externen API';

CREATE INDEX IF NOT EXISTS idx_products_integration_external ON products(integration_id, external_id);
