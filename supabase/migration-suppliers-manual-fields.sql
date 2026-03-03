-- ============================================
-- Lieferanten: Typ "manuell" (ohne Schnittstelle) + alle Infos für Bestellung mit einem Klick
-- ============================================

-- type um 'manual' erweitern (bestehenden Check entfernen, neuen setzen)
ALTER TABLE suppliers DROP CONSTRAINT IF EXISTS suppliers_type_check;
ALTER TABLE suppliers ADD CONSTRAINT suppliers_type_check CHECK (type IN ('email', 'api', 'manual'));

-- Zusatzfelder für vollständige Lieferanten-Stammdaten (insb. manuell)
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS contact_person TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS order_email TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS website TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS minimum_order_value DECIMAL(10,2);
ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS payment_terms TEXT;

COMMENT ON COLUMN suppliers.contact_person IS 'Ansprechpartner beim Lieferanten';
COMMENT ON COLUMN suppliers.order_email IS 'E-Mail für Bestellungen (falls anders als contact_email)';
COMMENT ON COLUMN suppliers.website IS 'Website / Katalog-URL';
COMMENT ON COLUMN suppliers.notes IS 'Notizen (Mindestbestellmenge, Lieferzeiten, Besonderheiten)';
COMMENT ON COLUMN suppliers.minimum_order_value IS 'Mindestbestellwert in EUR';
COMMENT ON COLUMN suppliers.payment_terms IS 'Zahlungsbedingungen (z. B. 14 Tage netto)';

-- Bestehende Einträge: type auf 'manual' setzen falls NULL (nach alter Migration)
UPDATE suppliers SET type = 'manual' WHERE type IS NULL;
