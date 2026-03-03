-- Zusätzliche Bestellstatus: Stornierung beantragt, Rücksendung beantragt, Rücksendung abgeschlossen.

ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (
  status IN (
    'pending',
    'processing',
    'shipped',
    'delivered',
    'cancelled',
    'cancellation_requested',
    'return_requested',
    'return_completed'
  )
);

COMMENT ON COLUMN orders.status IS 'pending=Ausstehend, processing=In Bearbeitung, shipped=Versandt, delivered=Zugestellt, cancelled=Storniert, cancellation_requested=Stornierung beantragt, return_requested=Rücksendung beantragt, return_completed=Rücksendung abgeschlossen';
