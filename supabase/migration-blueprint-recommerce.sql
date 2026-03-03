-- ============================================
-- Blueprint 2.1: Re-Commerce – Trade-In & Store Credit
-- ============================================

CREATE SCHEMA IF NOT EXISTS recommerce;

-- Kunden Trade-In Anfragen
CREATE TABLE IF NOT EXISTS recommerce.trade_in_requests (
  trade_in_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  original_asin VARCHAR(15),
  condition_answers JSONB NOT NULL,
  quoted_value NUMERIC(10,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'LABEL_GENERATED' CHECK (status IN (
    'LABEL_GENERATED', 'IN_TRANSIT', 'INSPECTING', 'ACCEPTED', 'REJECTED', 'RETURNED_TO_CUSTOMER'
  )),
  final_credited_amount NUMERIC(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_trade_in_requests_customer ON recommerce.trade_in_requests(customer_id);
CREATE INDEX IF NOT EXISTS idx_trade_in_requests_status ON recommerce.trade_in_requests(status);
CREATE INDEX IF NOT EXISTS idx_trade_in_requests_created ON recommerce.trade_in_requests(created_at DESC);

COMMENT ON TABLE recommerce.trade_in_requests IS 'Trade-In Anfragen: Kunde verkauft gebrauchtes Gerät gegen Store Credit';

-- Store Credit Wallet für Kundenbindung
CREATE TABLE IF NOT EXISTS recommerce.store_credit_wallets (
  wallet_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID UNIQUE NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_balance NUMERIC(10,2) DEFAULT 0.00 CHECK (current_balance >= 0),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_store_credit_wallets_customer ON recommerce.store_credit_wallets(customer_id);

COMMENT ON TABLE recommerce.store_credit_wallets IS 'Plattform-Guthaben (Store Credit) für Kunden nach Trade-In';

-- Store Credit Transaktionen (Audit-Trail)
CREATE TABLE IF NOT EXISTS recommerce.store_credit_transactions (
  transaction_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES recommerce.store_credit_wallets(wallet_id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  reason VARCHAR(100) NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_store_credit_tx_wallet ON recommerce.store_credit_transactions(wallet_id);

-- original_asin: Referenz auf ASIN (catalog.amazon_standard_identification_numbers), kein FK für Flexibilität
CREATE INDEX IF NOT EXISTS idx_trade_in_requests_asin ON recommerce.trade_in_requests(original_asin) WHERE original_asin IS NOT NULL;

ALTER TABLE recommerce.trade_in_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommerce.store_credit_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommerce.store_credit_transactions ENABLE ROW LEVEL SECURITY;
