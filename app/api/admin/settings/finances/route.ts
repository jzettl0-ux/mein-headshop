import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { logEntityChanges } from '@/lib/audit-log'
import { FINANCE_SETTINGS_ROW_ID } from '@/lib/finance-settings'

export const dynamic = 'force-dynamic'

/** GET – Aktuelle Finanz-Parameter (tax_rate, mollie_fixed, mollie_percent, revenue_limit) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  let { data, error } = await admin.from('finance_settings').select('tax_rate, mollie_fixed, mollie_percent, revenue_limit').eq('id', FINANCE_SETTINGS_ROW_ID).maybeSingle()
  if (!data && !error) {
    const r = await admin.from('finance_settings').select('tax_rate, mollie_fixed, mollie_percent, revenue_limit').eq('id', 1).maybeSingle()
    data = r.data
    error = r.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const defaults = { tax_rate: 30, mollie_fixed: 0.29, mollie_percent: 0.25, revenue_limit: 22500 }
  const row = data || defaults
  return NextResponse.json({
    tax_rate: Number(row.tax_rate) ?? defaults.tax_rate,
    mollie_fixed: Number(row.mollie_fixed) ?? defaults.mollie_fixed,
    mollie_percent: Number(row.mollie_percent) ?? defaults.mollie_percent,
    revenue_limit: Number(row.revenue_limit) ?? defaults.revenue_limit,
  })
}

/** PATCH – Finanz-Parameter aktualisieren. Body: tax_rate?, mollie_fixed?, mollie_percent?, revenue_limit? */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, number> = {}
  if (typeof body.tax_rate === 'number' && body.tax_rate >= 0 && body.tax_rate <= 100) updates.tax_rate = body.tax_rate
  if (typeof body.mollie_fixed === 'number' && body.mollie_fixed >= 0) updates.mollie_fixed = body.mollie_fixed
  if (typeof body.mollie_percent === 'number' && body.mollie_percent >= 0) updates.mollie_percent = body.mollie_percent
  if (typeof body.revenue_limit === 'number' && body.revenue_limit > 0) updates.revenue_limit = body.revenue_limit
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine gültigen Felder' }, { status: 400 })

  const admin = createSupabaseAdmin()
  let { data: current } = await admin.from('finance_settings').select('tax_rate, mollie_fixed, mollie_percent, revenue_limit').eq('id', FINANCE_SETTINGS_ROW_ID).maybeSingle()
  if (!current) {
    const r = await admin.from('finance_settings').select('tax_rate, mollie_fixed, mollie_percent, revenue_limit').eq('id', 1).maybeSingle()
    current = r.data
  }
  const rowId = current ? FINANCE_SETTINGS_ROW_ID : 1
  const payload = { ...updates, updated_at: new Date().toISOString() }
  let { data, error } = await admin.from('finance_settings').update(payload).eq('id', FINANCE_SETTINGS_ROW_ID).select().single()
  if (!data && error) {
    const r = await admin.from('finance_settings').update(payload).eq('id', 1).select().single()
    data = r.data
    error = r.error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { staff } = await getAdminContext()
  const oldRecord = (current ?? {}) as Record<string, unknown>
  const newRecord = { ...oldRecord, ...updates }
  await logEntityChanges(admin, 'finance_settings', String(rowId), oldRecord, newRecord, { email: staff?.email, id: staff?.id })

  return NextResponse.json(data)
}
