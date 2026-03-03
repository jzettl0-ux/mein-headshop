/**
 * Blueprint TEIL 20.5: Review Requests (5–30 Tage nach Lieferung)
 * GET: Liste (mit Order/Vendor-Infos soweit möglich)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const vendorId = searchParams.get('vendor_id')
  const admin = createSupabaseAdmin()
  let q = admin.schema('customer_engagement').from('review_requests').select('*').order('requested_at', { ascending: false })
  if (status && ['SENT', 'BOUNCED', 'REVIEW_LEFT'].includes(status)) q = q.eq('status', status)
  if (vendorId) q = q.eq('vendor_id', vendorId)
  const { data: rows, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = (rows ?? []) as Array<{ order_id: string; vendor_id: string; [k: string]: unknown }>
  const orderIds = [...new Set(list.map((r) => r.order_id))]
  const vendorIds = [...new Set(list.map((r) => r.vendor_id))]
  let orders: Array<{ id: string; order_number?: string }> = []
  let vendors: Array<{ id: string; company_name: string | null }> = []
  if (orderIds.length > 0) {
    const { data: o } = await admin.from('orders').select('id, order_number').in('id', orderIds)
    orders = (o ?? []) as Array<{ id: string; order_number?: string }>
  }
  if (vendorIds.length > 0) {
    const { data: v } = await admin.from('vendor_accounts').select('id, company_name').in('id', vendorIds)
    vendors = (v ?? []) as Array<{ id: string; company_name: string | null }>
  }
  const orderById = Object.fromEntries(orders.map((o) => [o.id, o]))
  const vendorById = Object.fromEntries(vendors.map((v) => [v.id, v]))
  const result = list.map((r) => ({
    ...r,
    order_number: orderById[r.order_id]?.order_number ?? null,
    vendor_name: vendorById[r.vendor_id]?.company_name ?? null,
  }))
  return NextResponse.json(result)
}
