-- Optionaler Anzeigename für Bewertungen (frei wählbar, wird öffentlich angezeigt)
-- E-Mail bleibt nur zur Verifizierung und wird nicht veröffentlicht.
ALTER TABLE product_reviews
  ADD COLUMN IF NOT EXISTS display_name TEXT;

COMMENT ON COLUMN product_reviews.display_name IS 'Optionaler Name, den der Kunde für die öffentliche Anzeige seiner Bewertung wählt. Wird nicht mit E-Mail verknüpft veröffentlicht.';
