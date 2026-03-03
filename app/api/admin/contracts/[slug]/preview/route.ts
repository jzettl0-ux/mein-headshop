import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { replaceContractPlaceholders } from '@/lib/legal-pdf'
import { getDefaultContractPlaceholdersAsync } from '@/lib/contract-placeholders'

export const dynamic = 'force-dynamic'

/** GET – Vertragstext mit ersetzten Platzhaltern (Admin, Vorschau/Druck) */
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
    .select('template_text')
    .eq('slug', slug)
    .maybeSingle()
  if (error || !data) return NextResponse.json({ error: 'Vertrag nicht gefunden' }, { status: 404 })
  const searchParams = req.nextUrl.searchParams
  const placeholders = await getDefaultContractPlaceholdersAsync({
    employee_name: searchParams.get('employee_name') || undefined,
    employee_address: searchParams.get('employee_address') || undefined,
    start_date: searchParams.get('start_date') || undefined,
  })
  const text = replaceContractPlaceholders(data.template_text || '', placeholders)
  return NextResponse.json({ text })
}
