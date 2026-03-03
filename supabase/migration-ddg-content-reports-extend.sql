-- Phase 5: DDG Notice & Action - Erweiterung fuer Meldeformular
-- Fuehre NACH migration-compliance-schema.sql aus

ALTER TABLE compliance.ddg_content_reports
  ADD COLUMN IF NOT EXISTS report_description TEXT,
  ADD COLUMN IF NOT EXISTS reporter_email TEXT;

COMMENT ON COLUMN compliance.ddg_content_reports.report_description IS 'Beschreibung des gemeldeten Inhalts (vom Melder)';
COMMENT ON COLUMN compliance.ddg_content_reports.reporter_email IS 'E-Mail des Melders (optional, fuer Rueckfragen)';
