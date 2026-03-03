/**
 * Blueprint TEIL 20.4: Stranded Inventory
 * GET: Liste (mit Vendor-Name) | POST: Neuer Eintrag
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const REASONS = ['LISTING_DELETED', 'ACCOUNT_SUSPENDED', 'COMPLIANCE_MISSING'] as const
const STATUSES = ['PENDING_ACTION', 'REMOVAL_REQUESTED', 'LIQUIDATED', 'DESTROYED'] as const

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const { searchParams } = new URL(request.url)
  const vendorId = searchParams.get('vendor_id')
  const status = searchParams.get('status')
  const admin = createSupabaseAdmin()
  let q = admin.schema('logistics_optimization').from('stranded_inventory').select('*').order('stranded_since', { ascending: false })
  if (vendorId) q = q.eq('vendor_id', vendorId)
  if (status && STATUSES.includes(status as typeof STATUSES[number])) q = q.eq('status', status)
  const { data: rows, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = (rows ?? []) as Array<{ vendor_id: string; [k: string]: unknown }>
  const vendorIds = [...new Set(list.map((r) => r.vendor_id))]
  let vendors: Array<{ id: string; company_name: string | null }> = []
  if (vendorIds.length > 0) {
    const { data: va } = await admin.from('vendor_accounts').select('id, company_name').in('id', vendorIds)
    vendors = (va ?? []) as Array<{ id: string; company_name: string | null }>
  }
  const byId = Object.fromEntries(vendors.map((v) => [v.id, v]))
  const result = list.map((r) => ({ ...r, vendor_name: byId[r.vendor_id]?.company_name ?? null }))
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const vendorId = body.vendor_id
  const asin = String(body.asin ?? '').trim().slice(0, 15)
  const quantity = Math.max(0, Math.floor(Number(body.stranded_quantity) ?? 0))
  const reason = REASONS.includes(body.stranded_reason) ? body.stranded_reason : 'LISTING_DELETED'
  if (!vendorId) return NextResponse.json({ error: 'vendor_id fehlt' }, { status: 400 })
  if (!asin) return NextResponse.json({ error: 'asin fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('logistics_optimization')
    .from('stranded_inventory')
    .insert({
      vendor_id: vendorId,
      asin,
      stranded_quantity: quantity,
      stranded_reason: reason,
      accumulated_fees: Math.max(0, Number(body.accumulated_fees) ?? 0),
      status: STATUSES.includes(body.status as typeof STATUSES[number]) ? body.status : 'PENDING_ACTION',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
