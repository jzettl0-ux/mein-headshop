-- ============================================
-- FIX: order_items Tabelle - Fehlende price Spalte
-- ============================================
-- Führe dieses Script in Supabase SQL Editor aus

-- Prüfe ob Spalte existiert
DO $$ 
BEGIN
  -- Füge price Spalte hinzu falls sie fehlt
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'price'
  ) THEN
    ALTER TABLE order_items ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;
  END IF;
  
  -- Füge total Spalte hinzu falls sie fehlt
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'order_items' 
    AND column_name = 'total'
  ) THEN
    ALTER TABLE order_items ADD COLUMN total DECIMAL(10,2) NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Erfolgsmeldung
SELECT 'order_items Tabelle erfolgreich aktualisiert!' as status;

-- Prüfe die Spalten
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'order_items'
ORDER BY ordinal_position;
