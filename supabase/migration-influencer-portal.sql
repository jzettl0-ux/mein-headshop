-- ============================================
-- INFLUENCER & AFFILIATE PORTAL
-- Login, Provision, Klicks, Auszahlungen
-- ============================================

-- 1) Influencer: Login & Provision
ALTER TABLE influencers
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,2) DEFAULT 10 CHECK (commission_rate >= 0 AND commission_rate <= 100),
  ADD COLUMN IF NOT EXISTS can_request_code_change BOOLEAN DEFAULT false;

CREATE UNIQUE INDEX IF NOT EXISTS idx_influencers_user_id ON influencers(user_id) WHERE user_id IS NOT NULL;
COMMENT ON COLUMN influencers.user_id IS 'Supabase Auth: Login für Influencer-Dashboard';
COMMENT ON COLUMN influencers.commission_rate IS 'Provisionssatz in % (z. B. 10 = 10%)';
COMMENT ON COLUMN influencers.can_request_code_change IS 'Darf der Influencer einen neuen Code anfragen?';

-- 2) Rabattcode ↔ Influencer verknüpfen (ein Code pro Influencer)
ALTER TABLE discount_codes ADD COLUMN IF NOT EXISTS influencer_id UUID REFERENCES influencers(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_discount_codes_influencer ON discount_codes(influencer_id);

-- 3) Klick-Tracking (optional)
CREATE TABLE IF NOT EXISTS influencer_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_influencer_clicks_influencer ON influencer_clicks(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_clicks_created ON influencer_clicks(created_at);

-- 4) Auszahlungen
CREATE TABLE IF NOT EXISTS influencer_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'requested', 'paid')),
  requested_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  note TEXT
);
CREATE INDEX IF NOT EXISTS idx_influencer_payouts_influencer ON influencer_payouts(influencer_id);
CREATE INDEX IF NOT EXISTS idx_influencer_payouts_status ON influencer_payouts(status);

-- 5) Code-Änderung anfragen (Influencer fragt neuen Code an, Admin setzt um)
CREATE TABLE IF NOT EXISTS influencer_code_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  influencer_id UUID NOT NULL REFERENCES influencers(id) ON DELETE CASCADE,
  requested_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_influencer_code_requests_influencer ON influencer_code_requests(influencer_id);

-- RLS: Influencer darf eigene Daten lesen (user_id = auth.uid())
ALTER TABLE influencer_payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_code_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Influencer can view own payouts" ON influencer_payouts;
CREATE POLICY "Influencer can view own payouts" ON influencer_payouts FOR SELECT
  USING (
    influencer_id IN (SELECT id FROM influencers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Influencer can view own code requests" ON influencer_code_requests;
CREATE POLICY "Influencer can view own code requests" ON influencer_code_requests FOR SELECT
  USING (
    influencer_id IN (SELECT id FROM influencers WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Influencer can request code change" ON influencer_code_requests;
CREATE POLICY "Influencer can request code change" ON influencer_code_requests FOR INSERT
  WITH CHECK (
    influencer_id IN (SELECT id FROM influencers WHERE user_id = auth.uid() AND can_request_code_change = true)
  );
