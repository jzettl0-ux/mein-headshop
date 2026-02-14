/**
 * Unternehmensdaten für Rechnungen (§14 UStG)
 * Aus ENV oder Fallback – bitte in .env.local anpassen.
 */
export interface CompanyInfo {
  name: string
  address: string
  postalCode: string
  city: string
  country: string
  vatId: string | null
  email: string
  phone?: string
}

export function getCompanyInfo(): CompanyInfo {
  return {
    name: process.env.INVOICE_COMPANY_NAME || 'Premium Headshop',
    address: process.env.INVOICE_COMPANY_ADDRESS || 'Musterstraße 1',
    postalCode: process.env.INVOICE_POSTAL_CODE || '12345',
    city: process.env.INVOICE_CITY || 'Berlin',
    country: process.env.INVOICE_COUNTRY || 'Deutschland',
    vatId: process.env.INVOICE_VAT_ID || null,
    email: process.env.INVOICE_EMAIL || process.env.RESEND_FROM_EMAIL || 'support@premium-headshop.de',
    phone: process.env.INVOICE_PHONE || undefined,
  }
}
