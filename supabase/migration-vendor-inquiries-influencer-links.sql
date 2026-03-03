-- Vendor-Anfragen: Influencer-Konten / Social Links
-- Plattformen: instagram, tiktok, youtube, twitter, twitch, andere (flexibel)

ALTER TABLE vendor_inquiries
  ADD COLUMN IF NOT EXISTS influencer_links JSONB DEFAULT '{}';

COMMENT ON COLUMN vendor_inquiries.influencer_links IS 'Social-Links bei Influencer-Anfragen: {instagram, tiktok, youtube, twitter, twitch, andere}';
