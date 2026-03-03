-- Fügt affiliate_code zu orders hinzu (fehlte bei Bestellabschluss)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS affiliate_code TEXT;
