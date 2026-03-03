-- ============================================
-- Blueprint Teil 5: Social Commerce & Split Payment
-- UGC (Rate my Setup), Split Payment / Gruppen-Warenkorb
-- ============================================

CREATE SCHEMA IF NOT EXISTS community;
CREATE SCHEMA IF NOT EXISTS checkout;

-- 12. UGC Posts (Rate my Setup)
CREATE TABLE IF NOT EXISTS community.ugc_posts (
  post_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  image_url VARCHAR(500) NOT NULL,
  caption TEXT,
  status VARCHAR(20) DEFAULT 'PENDING_MODERATION' CHECK (status IN ('PENDING_MODERATION', 'PUBLISHED', 'REJECTED')),
  likes_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ugc_posts_status ON community.ugc_posts(status) WHERE status = 'PUBLISHED';

-- Shoppable Hotspots (X/Y Koordinaten Mapping)
CREATE TABLE IF NOT EXISTS community.ugc_hotspots (
  hotspot_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES community.ugc_posts(post_id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  x_coordinate NUMERIC(5,2) NOT NULL,
  y_coordinate NUMERIC(5,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ugc_hotspots_post ON community.ugc_hotspots(post_id);

COMMENT ON TABLE community.ugc_posts IS 'User-Generated Content: Bilder von Setups (Rate my Setup)';
COMMENT ON TABLE community.ugc_hotspots IS 'Shoppable Hotspots: Produkt-Verknüpfung auf Bildern';

-- 13. Split Payment / Gruppen-Warenkorb
CREATE TABLE IF NOT EXISTS checkout.split_payments (
  split_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  initiator_customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  total_order_amount NUMERIC(10,2) NOT NULL,
  total_paid_so_far NUMERIC(10,2) DEFAULT 0.00,
  share_token VARCHAR(64) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'AWAITING_FUNDS' CHECK (status IN ('AWAITING_FUNDS', 'FULLY_PAID', 'EXPIRED', 'REFUNDED')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_split_payments_token ON checkout.split_payments(share_token);
CREATE INDEX IF NOT EXISTS idx_split_payments_status ON checkout.split_payments(status);

-- Individuelle Teilnehmer
CREATE TABLE IF NOT EXISTS checkout.split_payment_participants (
  participant_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  split_id UUID NOT NULL REFERENCES checkout.split_payments(split_id) ON DELETE CASCADE,
  customer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_email VARCHAR(255),
  amount_assigned NUMERIC(10,2) NOT NULL,
  amount_paid NUMERIC(10,2) DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'SUCCESS', 'FAILED')),
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_split_participants_split ON checkout.split_payment_participants(split_id);

COMMENT ON TABLE checkout.split_payments IS 'Gruppen-Warenkorb: Split Payment mit Share-Link (WhatsApp)';
COMMENT ON TABLE checkout.split_payment_participants IS 'Teilnehmer einer Gruppen-Zahlung';

ALTER TABLE community.ugc_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE community.ugc_hotspots ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout.split_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkout.split_payment_participants ENABLE ROW LEVEL SECURITY;
