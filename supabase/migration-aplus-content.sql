-- Phase 10.5: A+ Content (Enhanced Brand Content)
-- catalog.aplus_content: visueller Baukasten fuer PDP (Marken-Inhalte)

CREATE SCHEMA IF NOT EXISTS catalog;

CREATE TABLE IF NOT EXISTS catalog.aplus_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  block_type VARCHAR(50) NOT NULL CHECK (block_type IN (
    'image_text',
    'text_only',
    'comparison_table',
    'feature_list',
    'image_gallery'
  )),
  content JSONB NOT NULL DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aplus_content_product ON catalog.aplus_content(product_id);
CREATE INDEX IF NOT EXISTS idx_aplus_content_sort ON catalog.aplus_content(product_id, sort_order) WHERE is_active = true;

COMMENT ON TABLE catalog.aplus_content IS 'Enhanced Brand Content (A+) – Bausteine fuer Produktdetailseite';
COMMENT ON COLUMN catalog.aplus_content.block_type IS 'image_text, text_only, comparison_table, feature_list, image_gallery';
COMMENT ON COLUMN catalog.aplus_content.content IS 'JSON je nach block_type: heading, body, image_url, rows, etc.';

ALTER TABLE catalog.aplus_content ENABLE ROW LEVEL SECURITY;
