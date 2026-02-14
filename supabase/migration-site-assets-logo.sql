-- ============================================
-- Site-Assets Bucket (Logo etc.) + logo_url in site_settings
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public site assets are viewable by everyone" ON storage.objects;
CREATE POLICY "Public site assets are viewable by everyone"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'site-assets');

DROP POLICY IF EXISTS "Admin can upload site assets" ON storage.objects;
CREATE POLICY "Admin can upload site assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-assets'
    AND is_admin()
  );

DROP POLICY IF EXISTS "Admin can update site assets" ON storage.objects;
CREATE POLICY "Admin can update site assets"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'site-assets' AND is_admin())
  WITH CHECK (bucket_id = 'site-assets' AND is_admin());

DROP POLICY IF EXISTS "Admin can delete site assets" ON storage.objects;
CREATE POLICY "Admin can delete site assets"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'site-assets' AND is_admin());
