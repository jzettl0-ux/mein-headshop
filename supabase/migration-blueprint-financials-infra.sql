-- ============================================
-- Blueprint Teil 7 & 8: Financial Security & Infrastructure
-- Blended Shipping, Account Reserve, Compliance Filter, FBT, EPR, Dayparting, SOR
-- ============================================

CREATE SCHEMA IF NOT EXISTS advanced_financials;
CREATE SCHEMA IF NOT EXISTS catalog_defense;
CREATE SCHEMA IF NOT EXISTS infrastructure;

-- 20. Blended Shipping Rules (Split-Routing Versandkosten)
CREATE TABLE IF NOT EXISTS advanced_financials.blended_shipping_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  cart_vendor_count INT NOT NULL,
  customer_shipping_fee NUMERIC(10,2) NOT NULL,
  vendor_subsidy_percentage NUMERIC(5,2) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE advanced_financials.blended_shipping_rules IS 'Blended Shipping: Mischkalkulation bei Multi-Vendor-Warenkorb';

-- 21. Account Level Reserve (Escrow) – nur wenn fulfillment.order_lines existiert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'fulfillment' AND table_name = 'order_lines') THEN
    CREATE TABLE IF NOT EXISTS advanced_financials.account_reserves (
      reserve_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
      order_line_id UUID REFERENCES fulfillment.order_lines(id) ON DELETE SET NULL,
      order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
      held_amount NUMERIC(10,2) NOT NULL,
      delivery_confirmed_at TIMESTAMPTZ,
      release_date TIMESTAMPTZ,
      status VARCHAR(20) DEFAULT 'HELD' CHECK (status IN ('HELD', 'RELEASED', 'FORFEITED_REFUND')),
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_account_reserves_release ON advanced_financials.account_reserves(release_date) WHERE status = 'HELD';
    COMMENT ON TABLE advanced_financials.account_reserves IS '14-Tage-Escrow nach Lieferung für neue Händler. release_date = delivery_confirmed_at + 14 Tage (per Trigger).';
    CREATE OR REPLACE FUNCTION advanced_financials.account_reserves_set_release_date()
      RETURNS TRIGGER AS $func$
    BEGIN
      NEW.release_date := NEW.delivery_confirmed_at + INTERVAL '14 days';
      RETURN NEW;
    END; $func$ LANGUAGE plpgsql;
    DROP TRIGGER IF EXISTS trigger_account_reserves_release_date ON advanced_financials.account_reserves;
    CREATE TRIGGER trigger_account_reserves_release_date
      BEFORE INSERT OR UPDATE OF delivery_confirmed_at ON advanced_financials.account_reserves
      FOR EACH ROW
      WHEN (NEW.delivery_confirmed_at IS NOT NULL)
      EXECUTE PROCEDURE advanced_financials.account_reserves_set_release_date();
    ALTER TABLE advanced_financials.account_reserves ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 22. Pre-Index Compliance Filter (CanG-Wächter)
CREATE TABLE IF NOT EXISTS catalog_defense.percolate_rules (
  rule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  illegal_keyword VARCHAR(100) NOT NULL,
  category_context UUID REFERENCES product_categories(id) ON DELETE SET NULL,
  action VARCHAR(20) DEFAULT 'BLOCK' CHECK (action IN ('BLOCK', 'FLAG_FOR_REVIEW')),
  created_at TIMESTAMPTZ DEFAULT now()
);

COMMENT ON TABLE catalog_defense.percolate_rules IS 'Verbots-Suchbegriffe: Blockierung vor Indexierung';

-- 24. External Prices (Buy Box Suppression)
CREATE TABLE IF NOT EXISTS catalog_defense.external_prices (
  scrape_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  external_url VARCHAR(500) NOT NULL,
  external_price NUMERIC(10,2) NOT NULL,
  platform_price NUMERIC(10,2) NOT NULL,
  buy_box_suppressed BOOLEAN GENERATED ALWAYS AS (external_price < platform_price * 0.95) STORED,
  scraped_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_external_prices_suppressed ON catalog_defense.external_prices(vendor_id) WHERE buy_box_suppressed = TRUE;

COMMENT ON TABLE catalog_defense.external_prices IS 'MAP-Violation: Buy-Box-Suppression bei extern günstigerem Angebot';

-- 25. EPR Compliance (VerpackG, ElektroG)
CREATE TABLE IF NOT EXISTS infrastructure.epr_registrations (
  registration_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_accounts(id) ON DELETE CASCADE,
  epr_type VARCHAR(50) CHECK (epr_type IN ('LUCID_PACKAGING', 'WEEE_ELECTRONICS', 'BATT_G_BATTERIES')),
  registration_number VARCHAR(100) NOT NULL,
  verification_status VARCHAR(20) DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VALID', 'INVALID_SUSPENDED')),
  last_verified_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(vendor_id, epr_type)
);

COMMENT ON TABLE infrastructure.epr_registrations IS 'EPR-Registrierung: LUCID, WEEE – Verifizierung via Register';

-- 26. Frequently Bought Together
CREATE TABLE IF NOT EXISTS infrastructure.frequently_bought_together (
  association_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  anchor_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  associated_product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  co_occurrence_count INT DEFAULT 0,
  is_virtual_bundle BOOLEAN DEFAULT FALSE,
  bundle_discount_percentage NUMERIC(4,2) DEFAULT 0.00,
  last_calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(anchor_product_id, associated_product_id)
);

CREATE INDEX IF NOT EXISTS idx_fbt_anchor ON infrastructure.frequently_bought_together(anchor_product_id) WHERE co_occurrence_count > 10;

COMMENT ON TABLE infrastructure.frequently_bought_together IS 'Wird oft zusammen gekauft – Assoziationen aus Transaktionen';

-- 28. PPC Dayparting – nur wenn advertising.campaigns existiert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'advertising' AND table_name = 'campaigns') THEN
    CREATE TABLE IF NOT EXISTS infrastructure.campaign_schedules (
      schedule_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      campaign_id UUID REFERENCES advertising.campaigns(campaign_id) ON DELETE CASCADE,
      day_of_week INT CHECK (day_of_week BETWEEN 1 AND 7),
      time_window_start TIME NOT NULL,
      time_window_end TIME NOT NULL,
      bid_multiplier NUMERIC(4,2) DEFAULT 1.00,
      is_paused BOOLEAN DEFAULT FALSE
    );
    COMMENT ON TABLE infrastructure.campaign_schedules IS 'PPC Dayparting: Werbezeiten-Steuerung';
    ALTER TABLE infrastructure.campaign_schedules ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- 29. Smart Order Routing Log
CREATE TABLE IF NOT EXISTS infrastructure.smart_order_routing_logs (
  routing_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  split_shipment_cost NUMERIC(10,2) NOT NULL,
  consolidated_shipment_cost NUMERIC(10,2) NOT NULL,
  selected_strategy VARCHAR(50) CHECK (selected_strategy IN ('SPLIT_SHIPMENT', 'FC_CONSOLIDATION')),
  evaluated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE advanced_financials.blended_shipping_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_defense.percolate_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog_defense.external_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure.epr_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure.frequently_bought_together ENABLE ROW LEVEL SECURITY;
ALTER TABLE infrastructure.smart_order_routing_logs ENABLE ROW LEVEL SECURITY;
