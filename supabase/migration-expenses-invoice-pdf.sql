-- Rechnungen/Belege zu Ausgaben als PDF hochladen und verknüpfen
ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS invoice_pdf_url TEXT;

COMMENT ON COLUMN expenses.invoice_pdf_url IS 'Öffentliche URL des hochgeladenen Rechnungs-PDFs (Storage-Bucket expense-invoices).';

-- Optional: Bucket "expense-invoices" im Supabase Dashboard anlegen (Storage → New bucket, Public oder Private mit RLS).
