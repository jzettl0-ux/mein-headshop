-- ============================================
-- INFLUENCER MEDIA-ASSET-CENTER
-- Metadaten für Download-Portal & Admin-Mediathek
-- ============================================

CREATE TABLE IF NOT EXISTS influencer_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('product_photos', 'banner', 'logos')),
  visibility TEXT NOT NULL DEFAULT 'partner_only' CHECK (visibility IN ('public', 'partner_only')),
  storage_path TEXT NOT NULL UNIQUE,
  format_info TEXT,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_influencer_assets_category ON influencer_assets(category);
CREATE INDEX IF NOT EXISTS idx_influencer_assets_visibility ON influencer_assets(visibility);
CREATE INDEX IF NOT EXISTS idx_influencer_assets_created ON influencer_assets(created_at DESC);

COMMENT ON TABLE influencer_assets IS 'Medien-Assets für Influencer (Produktfotos, Banner, Logos)';
COMMENT ON COLUMN influencer_assets.format_info IS 'z.B. Optimiert für Instagram Story';

-- Storage-Bucket für Asset-Dateien (öffentlich lesbar für Downloads)
INSERT INTO storage.buckets (id, name, public)
VALUES ('influencer-assets', 'influencer-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public influencer-assets are viewable by everyone" ON storage.objects;
CREATE POLICY "Public influencer-assets are viewable by everyone" ON storage.objects
  FOR SELECT USING (bucket_id = 'influencer-assets');

DROP POLICY IF EXISTS "Admin can upload influencer-assets" ON storage.objects;
CREATE POLICY "Admin can upload influencer-assets" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'influencer-assets');

DROP POLICY IF EXISTS "Admin can update influencer-assets" ON storage.objects;
CREATE POLICY "Admin can update influencer-assets" ON storage.objects
  FOR UPDATE USING (bucket_id = 'influencer-assets') WITH CHECK (bucket_id = 'influencer-assets');

DROP POLICY IF EXISTS "Admin can delete influencer-assets" ON storage.objects;
CREATE POLICY "Admin can delete influencer-assets" ON storage.objects
  FOR DELETE USING (bucket_id = 'influencer-assets');
