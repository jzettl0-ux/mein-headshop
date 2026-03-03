import { getEnvOverrides, mergeWithEnv } from './env-overrides'

/**
 * Unternehmensdaten für Rechnungen (§14 UStG)
 * Aus Admin (site_settings env_overrides) oder ENV – bitte in .env.local oder Admin → Umgebung anpassen.
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

/** Sync: nur ENV (für Kontexte ohne DB-Zugriff). Bevorzuge getCompanyInfoAsync(). */
export function getCompanyInfo(): CompanyInfo {
  return {
    name: process.env.INVOICE_COMPANY_NAME || 'Premium Headshop',
    address: process.env.INVOICE_COMPANY_ADDRESS || 'Musterstraße 1',
    postalCode: process.env.INVOICE_POSTAL_CODE || '12345',
    city: process.env.INVOICE_CITY || 'Berlin',
    country: process.env.INVOICE_COUNTRY || 'Deutschland',
    vatId: process.env.INVOICE_VAT_ID || null,
    email: (() => {
      const raw = process.env.INVOICE_EMAIL || process.env.RESEND_FROM_EMAIL || 'support@premium-headshop.de'
      const match = raw.match(/<([^>]+)>/)
      return match ? match[1].trim() : raw.trim()
    })(),
    phone: process.env.INVOICE_PHONE || undefined,
  }
}

/** Async: liest zuerst Admin-Overrides (site_settings), dann ENV. Für Server Components & API. */
export async function getCompanyInfoAsync(): Promise<CompanyInfo> {
  const overrides = await getEnvOverrides()
  const m = mergeWithEnv(overrides)
  return {
    name: m.company_name,
    address: m.company_address,
    postalCode: m.company_postal_code,
    city: m.company_city,
    country: m.company_country,
    vatId: m.company_vat_id,
    email: m.company_email,
    phone: m.company_phone,
  }
}

/** Supportzeiten – Sync (nur ENV). */
export function getSupportHours(): string {
  return process.env.SUPPORT_HOURS || 'Mo–Fr 10–18 Uhr'
}

/** Async: Supportzeiten aus Admin oder ENV. */
export async function getSupportHoursAsync(): Promise<string> {
  const o = await getEnvOverrides()
  const m = mergeWithEnv(o)
  return m.support_hours
}

/** Vertreten durch – Sync (nur ENV). */
export function getRepresentedBy(): string {
  return process.env.COMPANY_REPRESENTED_BY || 'Geschäftsführer'
}

/** Async: Vertreten durch aus Admin oder ENV. */
export async function getRepresentedByAsync(): Promise<string> {
  const o = await getEnvOverrides()
  const m = mergeWithEnv(o)
  return m.company_represented_by
}

/** Async: Site-URL aus Admin oder ENV (z. B. für JSON-LD, E-Mails). */
export async function getSiteUrlAsync(): Promise<string> {
  const o = await getEnvOverrides()
  const m = mergeWithEnv(o)
  return m.site_url
}
