/**
 * Blueprint TEIL 20.3: Seller-Fulfilled Prime (SFP) Trials
 * GET: Liste mit Vendor-Name | POST: Neuen Trial anlegen (vendor_id)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data: trials, error } = await admin
    .schema('vendor_performance')
    .from('sfp_trials')
    .select('*')
    .order('trial_start_date', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (trials ?? []) as Array<{ vendor_id: string; [k: string]: unknown }>
  const vendorIds = [...new Set(rows.map((r) => r.vendor_id))]
  let vendors: Array<{ id: string; company_name: string | null; contact_email: string | null }> = []
  if (vendorIds.length > 0) {
    const { data: va } = await admin.from('vendor_accounts').select('id, company_name, contact_email').in('id', vendorIds)
    vendors = (va ?? []) as Array<{ id: string; company_name: string | null; contact_email: string | null }>
  }
  const byId = Object.fromEntries(vendors.map((v) => [v.id, v]))
  const list = rows.map((row) => ({
    ...row,
    vendor_name: byId[row.vendor_id]?.company_name ?? null,
    vendor_email: byId[row.vendor_id]?.contact_email ?? null,
  }))
  return NextResponse.json(list)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const vendorId = body.vendor_id
  if (!vendorId) return NextResponse.json({ error: 'vendor_id fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('vendor_performance')
    .from('sfp_trials')
    .insert({
      vendor_id: vendorId,
      status: body.status ?? 'IN_PROGRESS',
    })
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Für diesen Vendor existiert bereits ein SFP-Trial' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
