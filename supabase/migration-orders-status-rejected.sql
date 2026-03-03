-- Status „Stornierung abgelehnt“ und „Rücksendung abgelehnt“ für Admin-Auswahl und automatische Setzung bei Ablehnung.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'cancellation_requested',
    'cancellation_rejected',
    'return_requested',
    'return_rejected',
    'return_completed'
  )
);

COMMENT ON COLUMN orders.status IS '… cancellation_rejected=Stornierung abgelehnt, return_rejected=Rücksendung abgelehnt';
