-- Optional: Einzel-Shop ohne vendor_accounts kann SDS hochladen
ALTER TABLE compliance_hazmat.product_safety_data
  ALTER COLUMN vendor_id DROP NOT NULL;

COMMENT ON COLUMN compliance_hazmat.product_safety_data.vendor_id IS 'Vendor bei Marktplatz; NULL = Plattform (eigener Shop)';
