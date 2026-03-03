-- Phase 7.3: XRechnung XML-URL für Kundenrechnungen (E-Rechnung B2B 2025)

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS invoice_xml_url TEXT;

COMMENT ON COLUMN orders.invoice_xml_url IS 'Pfad zum XRechnung-XML in Storage (invoices Bucket) – E-Rechnung B2B-Pflicht';
