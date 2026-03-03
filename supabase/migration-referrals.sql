-- Refer-a-Friend: persönliche Codes und Empfehlungs-Tracking
CREATE TABLE IF NOT EXISTS referral_codes (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);

-- Jede Empfehlung: Werber, geworbener Kunde (E-Mail/User), Bestellung, Status
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  referred_email TEXT NOT NULL,
  referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_order ON referrals(order_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred_email ON referrals(referred_email);
CREATE UNIQUE INDEX IF NOT EXISTS idx_referrals_order_unique ON referrals(order_id) WHERE order_id IS NOT NULL;

COMMENT ON TABLE referral_codes IS 'Ein persönlicher Empfehlungscode pro Nutzer';
COMMENT ON TABLE referrals IS 'Empfehlungen: Werber, geworbener Kunde, Bestellung, Status';

-- Bestellung: optional Empfehlungs-Rabatt (10€ für Neukunden)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS referral_discount_amount DECIMAL(10,2) DEFAULT 0;
