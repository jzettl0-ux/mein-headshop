-- order_request_items: Admin-Status pro Artikel (Erstatten / Nicht erstattungsfähig)
ALTER TABLE order_request_items
  ADD COLUMN IF NOT EXISTS admin_status TEXT
    CHECK (admin_status IS NULL OR admin_status IN ('approved', 'not_refundable')),
  ADD COLUMN IF NOT EXISTS admin_note TEXT;

COMMENT ON COLUMN order_request_items.admin_status IS 'Admin: approved = wird erstattet/storniert, not_refundable = nicht erstattungsfähig (z.B. beschädigt, Hygiene geöffnet). NULL = noch nicht bearbeitet.';
COMMENT ON COLUMN order_request_items.admin_note IS 'Optionale Admin-Notiz, warum Artikel nicht erstattet werden kann.';
