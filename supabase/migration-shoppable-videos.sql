-- Phase 10.2: Shoppable Videos
-- MP4/MOV, max 5GB, Admin-Freigabe, KCanG-konform (§6: kein verherrlichendes Cannabis)

CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE IF NOT EXISTS catalog.shoppable_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  storage_path TEXT NOT NULL,
  file_size_bytes BIGINT,
  duration_seconds NUMERIC(8,2),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  kcan_checked_at TIMESTAMPTZ,
  kcan_approved BOOLEAN DEFAULT FALSE,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS catalog.shoppable_video_markers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES catalog.shoppable_videos(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  timestamp_seconds NUMERIC(8,2) NOT NULL,
  label VARCHAR(100)
);

CREATE INDEX IF NOT EXISTS idx_shoppable_videos_product ON catalog.shoppable_videos(product_id);
CREATE INDEX IF NOT EXISTS idx_shoppable_videos_status ON catalog.shoppable_videos(status) WHERE status = 'approved';
CREATE INDEX IF NOT EXISTS idx_shoppable_video_markers_video ON catalog.shoppable_video_markers(video_id);

COMMENT ON TABLE catalog.shoppable_videos IS 'Shoppable Videos (MP4/MOV, max 5GB). KCanG §6: Titel/Beschreibung duerfen Cannabis nicht verherrlichen.';
COMMENT ON TABLE catalog.shoppable_video_markers IS 'Produkt-Marker im Video (Zeitstempel + verlinktes Produkt).';

ALTER TABLE catalog.shoppable_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE catalog.shoppable_video_markers ENABLE ROW LEVEL SECURITY;

-- Storage-Bucket fuer Shoppable Videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('shoppable-videos', 'shoppable-videos', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public shoppable-videos are viewable" ON storage.objects;
CREATE POLICY "Public shoppable-videos are viewable" ON storage.objects
  FOR SELECT USING (bucket_id = 'shoppable-videos');

DROP POLICY IF EXISTS "Admin can upload shoppable-videos" ON storage.objects;
CREATE POLICY "Admin can upload shoppable-videos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'shoppable-videos');

DROP POLICY IF EXISTS "Admin can update shoppable-videos" ON storage.objects;
CREATE POLICY "Admin can update shoppable-videos" ON storage.objects
  FOR UPDATE USING (bucket_id = 'shoppable-videos') WITH CHECK (bucket_id = 'shoppable-videos');

DROP POLICY IF EXISTS "Admin can delete shoppable-videos" ON storage.objects;
CREATE POLICY "Admin can delete shoppable-videos" ON storage.objects
  FOR DELETE USING (bucket_id = 'shoppable-videos');
