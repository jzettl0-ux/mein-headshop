import { getCompanyInfo } from '@/lib/company'
import { createServerSupabase } from '@/lib/supabase-server'

export type ComplianceStatus = 'Konform' | 'Teilweise' | 'Offen'

export interface ComplianceCategory {
  id: string
  label: string
  status: ComplianceStatus
  standards: string[]
}

export interface ComplianceReport {
  shopName: string
  lastChecked: string | null
  categories: ComplianceCategory[]
}

const DEFAULT_CATEGORIES: ComplianceCategory[] = [
  {
    id: 'security',
    label: 'Sicherheit',
    status: 'Konform',
    standards: ['PCI DSS 4.0.1 (Zahlungsdaten)', 'TLS/SSL-Verschlüsselung', 'Sichere Session-Verwaltung', 'Keine geteilten Admin-Accounts (Zero-Trust)'],
  },
  {
    id: 'accessibility',
    label: 'Barrierefreiheit',
    status: 'Konform',
    standards: ['BFSG 2025', 'WCAG 2.1 Level AA (Kontraste, Fokus)', 'Tastaturbedienung', 'Screenreader-tauglich (ARIA, Semantik)'],
  },
  {
    id: 'legal',
    label: 'Recht',
    status: 'Konform',
    standards: ['DDG (Digitale-Dienste-Gesetz)', 'Impressum Art. 6 DDG', 'Widerrufsbutton (Pflicht ab 19.06.2026)', 'PAngV (Referenzpreis 30 Tage)', 'Gewährleistungs-/Garantie-Label (Pflicht ab 27.09.2026)'],
  },
  {
    id: 'privacy',
    label: 'Datenschutz',
    status: 'Konform',
    standards: ['DSGVO', 'Datenschutzerklärung aktuell', 'Bestelldaten zweckgebunden', 'Rechte auf Auskunft/Löschung'],
  },
]

export async function getComplianceReport(): Promise<ComplianceReport> {
  const company = getCompanyInfo()
  let lastChecked: string | null = null
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'last_compliance_check').maybeSingle()
    if (data?.value) lastChecked = data.value
  } catch {
    // ignore
  }
  return {
    shopName: company.name,
    lastChecked,
    categories: DEFAULT_CATEGORIES,
  }
}
