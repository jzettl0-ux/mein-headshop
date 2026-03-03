-- Optional: Brand Tailored Promotions ohne Vendor (Plattform/Einzel-Shop)
ALTER TABLE marketing.brand_tailored_promotions
  ALTER COLUMN vendor_id DROP NOT NULL;

COMMENT ON COLUMN marketing.brand_tailored_promotions.vendor_id IS 'Vendor bei Marktplatz; NULL = Plattform/Eigener Shop';
