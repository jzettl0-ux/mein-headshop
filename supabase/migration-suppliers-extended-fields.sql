-- Lieferanten: USt-IdNr, Bankverbindung, Versanddienstleister, API-Header (JSON)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS vat_id TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_iban TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_bic TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS bank_holder TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS shipping_provider TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS api_headers JSONB DEFAULT '{}';

COMMENT ON COLUMN suppliers.vat_id IS 'USt-IdNr. des Lieferanten';
COMMENT ON COLUMN suppliers.bank_iban IS 'IBAN für Zahlungen';
COMMENT ON COLUMN suppliers.bank_bic IS 'BIC/SWIFT';
COMMENT ON COLUMN suppliers.bank_holder IS 'Kontoinhaber';
COMMENT ON COLUMN suppliers.shipping_provider IS 'Versanddienstleister (DHL, DPD, …)';
COMMENT ON COLUMN suppliers.api_headers IS 'Zusätzliche API-Header (z. B. X-Api-Key, Accept-Language) als JSON';
