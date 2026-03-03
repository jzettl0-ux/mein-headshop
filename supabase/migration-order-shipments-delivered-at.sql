-- Phase 2.3: delivered_at für order_shipments (Tracking-Sync)
-- Wird vom Cron check-tracking gesetzt, wenn DHL "zugestellt" meldet.

ALTER TABLE order_shipments
  ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

COMMENT ON COLUMN order_shipments.delivered_at IS 'Zeitpunkt der Zustellung (aus DHL Tracking-Sync)';
