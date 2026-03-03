/**
 * Im Admin bearbeitbare Werte (sonst aus .env).
 * site_settings key: env_overrides (JSON).
 */
import { createServerSupabase } from './supabase-server'

export type EnvOverrides = {
  company_name?: string
  company_address?: string
  company_postal_code?: string
  company_city?: string
  company_country?: string
  company_vat_id?: string
  company_email?: string
  company_phone?: string
  company_represented_by?: string
  support_hours?: string
  site_url?: string
  site_name?: string
  resend_from_email?: string
  delivery_estimate_days?: string
}

const KEY = 'env_overrides'

export async function getEnvOverrides(): Promise<EnvOverrides> {
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.from('site_settings').select('value').eq('key', KEY).maybeSingle()
    if (data?.value && typeof data.value === 'string') {
      const parsed = JSON.parse(data.value) as EnvOverrides
      return parsed || {}
    }
  } catch {
    /* ignore */
  }
  return {}
}

function fromEnv(key: string): string | undefined {
  const v = process.env[key]
  return typeof v === 'string' && v.trim() ? v.trim() : undefined
}

/** E-Mail aus RESEND_FROM_EMAIL oder INVOICE_EMAIL extrahieren (ohne Anzeigenamen) */
function emailFromEnv(): string {
  const raw = fromEnv('INVOICE_EMAIL') || fromEnv('RESEND_FROM_EMAIL') || 'support@premium-headshop.de'
  const match = raw.match(/<([^>]+)>/)
  return match ? match[1].trim() : raw.trim()
}

/** Merged Company + Support + Site (Admin-Overrides haben Vorrang vor ENV) */
export function mergeWithEnv(overrides: EnvOverrides): {
  company_name: string
  company_address: string
  company_postal_code: string
  company_city: string
  company_country: string
  company_vat_id: string | null
  company_email: string
  company_phone: string | undefined
  company_represented_by: string
  support_hours: string
  site_url: string
  site_name: string
} {
  return {
    company_name: overrides.company_name ?? fromEnv('INVOICE_COMPANY_NAME') ?? 'Premium Headshop',
    company_address: overrides.company_address ?? fromEnv('INVOICE_COMPANY_ADDRESS') ?? 'Musterstraße 1',
    company_postal_code: overrides.company_postal_code ?? fromEnv('INVOICE_POSTAL_CODE') ?? '12345',
    company_city: overrides.company_city ?? fromEnv('INVOICE_CITY') ?? 'Berlin',
    company_country: overrides.company_country ?? fromEnv('INVOICE_COUNTRY') ?? 'Deutschland',
    company_vat_id: overrides.company_vat_id ?? fromEnv('INVOICE_VAT_ID') ?? null,
    company_email: overrides.company_email ?? emailFromEnv(),
    company_phone: overrides.company_phone ?? fromEnv('INVOICE_PHONE'),
    company_represented_by: overrides.company_represented_by ?? fromEnv('COMPANY_REPRESENTED_BY') ?? 'Geschäftsführer',
    support_hours: overrides.support_hours ?? fromEnv('SUPPORT_HOURS') ?? 'Mo–Fr 10–18 Uhr',
    site_url: overrides.site_url ?? fromEnv('NEXT_PUBLIC_SITE_URL') ?? 'http://localhost:3000',
    site_name: overrides.site_name ?? fromEnv('NEXT_PUBLIC_SITE_NAME') ?? 'Premium Headshop',
  }
}
