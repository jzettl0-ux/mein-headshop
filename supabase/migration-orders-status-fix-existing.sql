-- Bestehende Bestellungen mit ungültigem oder NULL-Status auf 'pending' setzen,
-- damit die CHECK-Constraint orders_status_check angewendet werden kann.
-- Einmal ausführen, wenn Fehler: "check constraint orders_status_check is violated by some row"

UPDATE orders
SET status = 'pending'
WHERE status IS NULL
   OR status NOT IN (
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
   );

-- Constraint neu anlegen (falls noch nicht vorhanden oder nach obigem Update)
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

COMMENT ON COLUMN orders.status IS 'pending, processing, shipped, delivered, cancelled, cancellation_requested, cancellation_rejected, return_requested, return_rejected, return_completed';
