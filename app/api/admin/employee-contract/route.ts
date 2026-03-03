import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { DEFAULT_EMPLOYEE_CONTRACT_TEMPLATE } from '@/lib/employee-contract-default'

const KEY = 'employee_contract_template'

export const dynamic = 'force-dynamic'

/** GET – Vertragsvorlage laden (nur Admin) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  const template = typeof data?.value === 'string' ? data.value : DEFAULT_EMPLOYEE_CONTRACT_TEMPLATE
  return NextResponse.json({ template })
}

/** POST – Vertragsvorlage speichern (nur Admin) */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  const template = typeof body.template === 'string' ? body.template : ''
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('site_settings').upsert({ key: KEY, value: template || DEFAULT_EMPLOYEE_CONTRACT_TEMPLATE }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
