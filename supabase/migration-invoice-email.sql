-- ============================================
-- Rechnung & E-Mail: invoice_url auf orders, Storage Bucket
-- ============================================

-- Spalte für Rechnungs-PDF-URL (wird nach Zahlungseingang gesetzt)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS invoice_url TEXT;

-- Falls discount-Spalten fehlen (bereits in manchen Setups vorhanden)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Storage Bucket für Rechnungen (privat – Zugriff nur über API mit Berechtigungsprüfung)
INSERT INTO storage.buckets (id, name, public)
VALUES ('invoices', 'invoices', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Nur Service Role / Backend darf in invoices schreiben/lesen (keine öffentlichen Policies)
-- Anonyme Lese-/Schreibzugriffe blockieren; Zugriff nur über API mit Auth-Check
