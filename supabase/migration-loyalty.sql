-- Loyalty & Rewards: Punkte, Tiers (Bronze/Silber/Gold), Transaktionen
CREATE TABLE IF NOT EXISTS loyalty_accounts (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points_balance INTEGER NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  tier TEXT NOT NULL DEFAULT 'bronze' CHECK (tier IN ('bronze', 'silver', 'gold')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loyalty_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL CHECK (reason IN ('order', 'review', 'redemption', 'adjustment')),
  reference_type TEXT,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_user ON loyalty_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_loyalty_transactions_created ON loyalty_transactions(created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_loyalty_transactions_review ON loyalty_transactions(reference_type, reference_id) WHERE reference_type = 'review';

COMMENT ON TABLE loyalty_accounts IS 'Punktekonto pro Nutzer; tier = bronze/silver/gold';
COMMENT ON TABLE loyalty_transactions IS 'Punkte-Buchungen (Gutschrift/Abzug)';

-- Einstellungen (Admin): Punkte pro €, pro Bewertung, Schwellen, Rabatte
CREATE TABLE IF NOT EXISTS loyalty_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO loyalty_settings (key, value) VALUES
  ('points_per_euro', '1'),
  ('points_per_review', '50'),
  ('points_per_eur_discount', '20'),
  ('silver_min_points', '500'),
  ('gold_min_points', '2000'),
  ('silver_discount_percent', '5'),
  ('gold_discount_percent', '10')
ON CONFLICT (key) DO NOTHING;

-- Bestellung: optional Punkte eingelöst + Tier-Rabatt für Nachvollziehbarkeit
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_points_redeemed INTEGER DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS loyalty_tier_discount_amount DECIMAL(10,2) DEFAULT 0;
