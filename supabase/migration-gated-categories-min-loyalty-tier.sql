-- Secret Shop: min_loyalty_tier_required für admin.gated_categories
-- Läuft nur wenn admin-Schema und gated_categories existieren (z. B. nach migration-category-gating)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'admin' AND table_name = 'gated_categories') THEN
    ALTER TABLE admin.gated_categories ADD COLUMN IF NOT EXISTS min_loyalty_tier_required INT DEFAULT 1;
    COMMENT ON COLUMN admin.gated_categories.min_loyalty_tier_required IS '1=Alle, 2=Silber+, 3=Gold nur – Secret Shop';
  END IF;
END $$;
