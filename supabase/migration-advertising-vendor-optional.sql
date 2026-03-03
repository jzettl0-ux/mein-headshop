-- Phase 9: Platform-Kampagnen ohne Vendor (für Einzel-Shops)
-- Erlaubt advertising.campaigns mit vendor_id = NULL für den eigenen Shop

ALTER TABLE advertising.campaigns
  ALTER COLUMN vendor_id DROP NOT NULL;

COMMENT ON COLUMN advertising.campaigns.vendor_id IS 'Vendor bei Marktplatz; NULL = Platform (eigener Shop)';
