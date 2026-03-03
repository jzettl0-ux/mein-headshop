-- Tracking: Wann wurde der Willkommens-Rabattcode per E-Mail versendet?
-- Cron sendet Code 1 Tag nach Newsletter-Anmeldung.

ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS discount_code_sent_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_newsletter_subscribers_discount_pending
  ON newsletter_subscribers(subscribed_at)
  WHERE is_active = true AND discount_code_sent_at IS NULL;

COMMENT ON COLUMN newsletter_subscribers.discount_code_sent_at IS 'Zeitpunkt, an dem der Willkommens-Rabattcode per E-Mail versendet wurde (1 Tag nach Anmeldung).';
