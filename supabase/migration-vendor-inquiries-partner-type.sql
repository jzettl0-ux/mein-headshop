-- Vendor-Anfragen: Partner-Typ (Influencer vs. Firma)

ALTER TABLE vendor_inquiries
  ADD COLUMN IF NOT EXISTS partner_type TEXT DEFAULT 'company'
  CHECK (partner_type IN ('influencer', 'company'));

COMMENT ON COLUMN vendor_inquiries.partner_type IS 'influencer = Influencer/Content Creator, company = Normale Firma/Händler';
