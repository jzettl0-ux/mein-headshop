-- Befristeter Vertrag: Enddatum beim Mitarbeiter (wie bei Vendoren/Lieferanten)
-- Leer = unbefristet; gesetzt = befristet bis zu diesem Datum.

ALTER TABLE staff ADD COLUMN IF NOT EXISTS contract_ends_at DATE;

COMMENT ON COLUMN staff.contract_ends_at IS 'Bei befristetem Arbeitsvertrag: Enddatum; null = unbefristet';

CREATE INDEX IF NOT EXISTS idx_staff_contract_ends_at ON staff(contract_ends_at) WHERE contract_ends_at IS NOT NULL;
