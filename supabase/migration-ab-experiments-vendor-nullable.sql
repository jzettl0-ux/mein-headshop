-- Optional: A/B-Experimente ohne Vendor (Plattform/Einzel-Shop)
ALTER TABLE marketing.ab_experiments
  ALTER COLUMN vendor_id DROP NOT NULL;

COMMENT ON COLUMN marketing.ab_experiments.vendor_id IS 'Vendor bei Marktplatz; NULL = Plattform/Eigener Shop';
