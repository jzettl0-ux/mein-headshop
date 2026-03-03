-- Optional: min_loyalty_tier_required für admin.gated_categories (Secret Shop)
-- Läuft nur wenn admin.gated_categories existiert
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'admin' AND table_name = 'gated_categories')
     AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'gamification' AND table_name = 'loyalty_tiers') THEN
    ALTER TABLE admin.gated_categories ADD COLUMN IF NOT EXISTS min_loyalty_tier_required INT DEFAULT 1;
  END IF;
END $$;
