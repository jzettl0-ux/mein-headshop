import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { generateEmployeeContractPdf } from '@/lib/legal-pdf'
import { getDefaultContractPlaceholdersAsync } from '@/lib/contract-placeholders'

export const dynamic = 'force-dynamic'

/** GET – Vertrag als PDF (Admin) */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const { slug } = await params
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('contract_templates')
    .select('label, template_text')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Vertrag nicht gefunden' }, { status: 404 })
  const searchParams = req.nextUrl.searchParams
  const placeholders = await getDefaultContractPlaceholdersAsync({
    employee_name: searchParams.get('employee_name') || undefined,
    employee_address: searchParams.get('employee_address') || undefined,
    start_date: searchParams.get('start_date') || undefined,
  })
  try {
    const pdf = await generateEmployeeContractPdf(data.template_text || '', placeholders)
    const filename = `${data.label.replace(/[^a-zA-Z0-9äöüÄÖÜß\-]/g, '-')}.pdf`
    return new NextResponse(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (e) {
    console.error('Contract PDF error:', e)
    return NextResponse.json({ error: 'PDF konnte nicht erstellt werden' }, { status: 500 })
  }
}
