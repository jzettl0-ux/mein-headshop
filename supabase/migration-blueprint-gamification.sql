-- ============================================
-- Blueprint Teil 4: Gamification & Conversion
-- 4:20 Vault, Voucher-Badges, Loyalty Tiers, Price Lock, Drop-Radar
-- ============================================

CREATE SCHEMA IF NOT EXISTS gamification;

CREATE TABLE IF NOT EXISTS gamification.vault_drops (
  drop_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  vendor_id UUID REFERENCES vendor_accounts(id) ON DELETE SET NULL,
  drop_price NUMERIC(10,2) NOT NULL,
  total_units_available INT NOT NULL CHECK (total_units_available > 0),
  units_locked_in_carts INT DEFAULT 0,
  units_sold INT DEFAULT 0,
  start_timestamp TIMESTAMPTZ NOT NULL,
  end_timestamp TIMESTAMPTZ NOT NULL,
  status VARCHAR(20) DEFAULT 'SCHEDULED' CHECK (status IN ('SCHEDULED', 'ACTIVE', 'SOLD_OUT', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vault_drops_active ON gamification.vault_drops(status) WHERE status = 'ACTIVE';
CREATE INDEX IF NOT EXISTS idx_vault_drops_times ON gamification.vault_drops(start_timestamp, end_timestamp);

CREATE TABLE IF NOT EXISTS gamification.user_clipped_vouchers (
  clip_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  is_redeemed BOOLEAN DEFAULT FALSE,
  clipped_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(customer_id, discount_code_id)
);

CREATE INDEX IF NOT EXISTS idx_user_clipped_vouchers_customer ON gamification.user_clipped_vouchers(customer_id);

CREATE TABLE IF NOT EXISTS gamification.loyalty_tiers (
  tier_id INT PRIMARY KEY,
  tier_name VARCHAR(50) NOT NULL,
  min_lifetime_spend NUMERIC(10,2) NOT NULL DEFAULT 0,
  free_shipping_unlocked BOOLEAN DEFAULT FALSE
);

INSERT INTO gamification.loyalty_tiers (tier_id, tier_name, min_lifetime_spend, free_shipping_unlocked)
VALUES (1, 'BRONZE', 0, FALSE), (2, 'SILVER', 500, FALSE), (3, 'GOLD', 1500, TRUE)
ON CONFLICT (tier_id) DO NOTHING;

CREATE TABLE IF NOT EXISTS gamification.price_locks (
  lock_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email VARCHAR(255),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  locked_price NUMERIC(10,2) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  is_redeemed BOOLEAN DEFAULT FALSE,
  token VARCHAR(64) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_price_locks_token ON gamification.price_locks(token);
CREATE INDEX IF NOT EXISTS idx_price_locks_expires ON gamification.price_locks(expires_at) WHERE is_redeemed = FALSE;

CREATE TABLE IF NOT EXISTS gamification.drop_radar_subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  notification_channel VARCHAR(20) DEFAULT 'WHATSAPP' CHECK (notification_channel IN ('WHATSAPP', 'SMS', 'EMAIL')),
  phone_number VARCHAR(50),
  email VARCHAR(255),
  is_notified BOOLEAN DEFAULT FALSE,
  early_access_token VARCHAR(64) UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_drop_radar_product ON gamification.drop_radar_subscriptions(product_id) WHERE is_notified = FALSE;

ALTER TABLE gamification.vault_drops ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.user_clipped_vouchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.loyalty_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.price_locks ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification.drop_radar_subscriptions ENABLE ROW LEVEL SECURITY;
