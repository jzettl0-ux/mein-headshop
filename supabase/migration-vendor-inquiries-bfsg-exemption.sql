-- BFSG §2 Nr.17: Kleinstunternehmen-Ausnahme bei Vendor-Onboarding
-- < 10 Beschäftigte und < 2 Mio € Jahresumsatz = von Barrierefreiheitspflicht ausgenommen

ALTER TABLE vendor_inquiries
  ADD COLUMN IF NOT EXISTS bfsg_micro_enterprise_exemption BOOLEAN DEFAULT false;

COMMENT ON COLUMN vendor_inquiries.bfsg_micro_enterprise_exemption IS '§2 Nr.17 BFSG: Bewerber erfüllt Kleinstunternehmen-Kriterien (<10 MA, <2M€ Umsatz) – wird bei Genehmigung in compliance.vendor_legal_flags übernommen';
