-- Produkt-Badges für Shop (NEU, Sale) und KI-Newsletter
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_new_override BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS on_sale BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS discount_text TEXT;

COMMENT ON COLUMN products.is_new_override IS 'Wenn true: Produkt wird immer als „NEU“ angezeigt (unabhängig von created_at).';
COMMENT ON COLUMN products.on_sale IS 'Wenn true: Sale-Badge und discount_text werden angezeigt.';
COMMENT ON COLUMN products.discount_text IS 'Text für die Sale-Plakette (z. B. „−20 %“ oder „Oster-Angebot“).';

-- View für KI-Newsletter: Neuheiten (≤14 Tage oder is_new_override) und Angebote (on_sale)
CREATE OR REPLACE VIEW ai_newsletter_data AS
SELECT
  p.id,
  p.name,
  p.slug,
  p.description,
  p.price,
  p.image_url,
  p.created_at,
  COALESCE(p.is_new_override, false) AS is_new_override,
  (p.created_at >= (NOW() - INTERVAL '14 days') OR COALESCE(p.is_new_override, false)) AS is_new,
  COALESCE(p.on_sale, false) AS on_sale,
  p.discount_text,
  p.discount_percent,
  p.discount_until
FROM products p
WHERE (p.is_active IS NULL OR p.is_active = true)
  AND (
    (p.created_at >= (NOW() - INTERVAL '14 days') OR COALESCE(p.is_new_override, false))
    OR COALESCE(p.on_sale, false)
  );

COMMENT ON VIEW ai_newsletter_data IS 'Produkte für Newsletter-KI: Neuheiten und Sales. is_new = neu (≤14 Tage oder Override), on_sale = Angebot.';
