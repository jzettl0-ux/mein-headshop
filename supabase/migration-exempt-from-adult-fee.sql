-- Produkte können von der 18+ Ident-Gebühr ausgenommen werden (z.B. Grinder ohne DHL-Altersprüfung)
ALTER TABLE products ADD COLUMN IF NOT EXISTS exempt_from_adult_fee BOOLEAN DEFAULT false;
COMMENT ON COLUMN products.exempt_from_adult_fee IS 'Wenn true: Produkt löst keine DHL-Ident-Gebühr und kein has_adult_items aus, auch wenn is_adult_only=true';
