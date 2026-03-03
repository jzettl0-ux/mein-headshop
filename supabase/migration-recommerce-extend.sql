-- Re-Commerce: Status PENDING für neue Anfragen, Grants

-- Status PENDING hinzufügen (Anfrage eingereicht, Label noch nicht erstellt)
ALTER TABLE recommerce.trade_in_requests
  DROP CONSTRAINT IF EXISTS trade_in_requests_status_check;

ALTER TABLE recommerce.trade_in_requests
  ADD CONSTRAINT trade_in_requests_status_check CHECK (status IN (
    'PENDING', 'LABEL_GENERATED', 'IN_TRANSIT', 'INSPECTING', 'ACCEPTED', 'REJECTED', 'RETURNED_TO_CUSTOMER'
  ));

ALTER TABLE recommerce.trade_in_requests
  ALTER COLUMN status SET DEFAULT 'PENDING';

-- Grants für service_role (falls Schema exponiert)
GRANT USAGE ON SCHEMA recommerce TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON recommerce.trade_in_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON recommerce.store_credit_wallets TO service_role;
GRANT SELECT, INSERT, DELETE ON recommerce.store_credit_transactions TO service_role;
