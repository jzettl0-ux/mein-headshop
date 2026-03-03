import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getCompanyInfoAsync, getRepresentedByAsync } from '@/lib/company'
import { generateEmployeeContractPdf } from '@/lib/legal-pdf'
import { DEFAULT_EMPLOYEE_CONTRACT_TEMPLATE } from '@/lib/employee-contract-default'

const KEY = 'employee_contract_template'

export const dynamic = 'force-dynamic'

/** GET – Vertrag als PDF (nur Admin). Query: employee_name, employee_address, start_date etc. für Platzhalter */
export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  const company = await getCompanyInfoAsync()
  const representedBy = await getRepresentedByAsync()

  const template =
    typeof data?.value === 'string' && data.value.trim()
      ? data.value
      : DEFAULT_EMPLOYEE_CONTRACT_TEMPLATE

  const searchParams = req.nextUrl.searchParams
  const startDate = searchParams.get('start_date') || new Date().toLocaleDateString('de-DE')
  const placeholders: Record<string, string> = {
    company_name: company.name,
    company_address: company.address,
    company_postal_code: company.postalCode,
    company_city: company.city,
    company_country: company.country,
    company_email: company.email,
    represented_by: representedBy,
    start_date: startDate,
    employee_name: searchParams.get('employee_name') || '___________________________',
    employee_address: searchParams.get('employee_address') || '___________________________',
  }

  try {
    const pdf = await generateEmployeeContractPdf(template, placeholders)
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="Mitarbeitervertrag.pdf"',
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('Employee contract PDF error:', e)
    return NextResponse.json({ error: 'PDF konnte nicht erstellt werden' }, { status: 500 })
  }
}
