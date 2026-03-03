import { createServerSupabase } from './supabase-server'
import { getCompanyInfoAsync, getRepresentedByAsync } from './company'

export type LegalSlug = 'impressum' | 'privacy' | 'terms' | 'returns'

export interface LegalContentRow {
  slug: string
  title: string
  content: string
  updated_at: string
}

/** Platzhalter ersetzen (mit übergebenem Objekt) */
export function replacePlaceholdersInLegalContent(content: string, placeholders: Record<string, string>): string {
  let out = content
  for (const [key, value] of Object.entries(placeholders)) {
    out = out.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value)
  }
  return out
}

/** Rechtstext aus DB laden (öffentlich, Server). Leerer content = null. Nutzt Admin-Overrides für Firmendaten. */
export async function getLegalContent(slug: LegalSlug): Promise<{ title: string; content: string } | null> {
  const supabase = await createServerSupabase()
  const { data, error } = await supabase
    .from('legal_texts')
    .select('title, content')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return null
  const raw = typeof data.content === 'string' ? data.content.trim() : ''
  if (!raw) return null
  const company = await getCompanyInfoAsync()
  const representedBy = await getRepresentedByAsync()
  const placeholders: Record<string, string> = {
    company_name: company.name,
    company_address: company.address,
    company_postal_code: company.postalCode,
    company_city: company.city,
    company_country: company.country,
    company_email: company.email,
    company_phone: company.phone ?? '',
    represented_by: representedBy,
    company_address_full: `${company.address}, ${company.postalCode} ${company.city}`,
  }
  const content = replacePlaceholdersInLegalContent(raw, placeholders)
  return { title: data.title || slug, content }
}
