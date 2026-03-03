import { getCompanyInfo, getCompanyInfoAsync, getRepresentedBy, getRepresentedByAsync } from './company'

function buildPlaceholders(company: { name: string; address: string; postalCode: string; city: string; country: string; email: string }, representedBy: string, overrides: Record<string, string | undefined>): Record<string, string> {
  const base: Record<string, string> = {
    company_name: company.name,
    company_address: company.address,
    company_postal_code: company.postalCode,
    company_city: company.city,
    company_country: company.country,
    company_email: company.email,
    represented_by: representedBy,
    start_date: new Date().toLocaleDateString('de-DE'),
    employee_name: '___________________________',
    employee_address: '___________________________',
    job_title: '___________________________',
    working_hours_week: '_____',
    salary_brutto: '_____',
    account_holder: '___________________________',
    bank_name: '___________________________',
    employee_iban: '___________________________',
    employee_bic: '___________________________',
    probezeit_monate: '_____',
    contract_end_date: '___________________________',
  }
  for (const [key, value] of Object.entries(overrides)) {
    if (value != null && value !== '') base[key] = value
  }
  return base
}

/** Sync: nur ENV (für Kontexte ohne DB). */
export function getDefaultContractPlaceholders(overrides: Record<string, string | undefined> = {}): Record<string, string> {
  const company = getCompanyInfo()
  const representedBy = getRepresentedBy()
  return buildPlaceholders(company, representedBy, overrides)
}

/** Async: Admin-Overrides + ENV. Für API-Routen und Server. */
export async function getDefaultContractPlaceholdersAsync(overrides: Record<string, string | undefined> = {}): Promise<Record<string, string>> {
  const company = await getCompanyInfoAsync()
  const representedBy = await getRepresentedByAsync()
  return buildPlaceholders(company, representedBy, overrides)
}
