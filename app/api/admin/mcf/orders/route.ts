/**
 * MCF-Orders: Admin API
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const vendor_id = searchParams.get('vendor_id')

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('logistics')
    .from('mcf_orders')
    .select('*, vendor_accounts(id, company_name)')
    .order('created_at', { ascending: false })

  if (status) q = q.eq('status', status)
  if (vendor_id) q = q.eq('vendor_id', vendor_id)

  const { data, error } = await q
  if (error) {
    if (error.code === '42P01') return NextResponse.json({ orders: [] })
    console.error('[admin/mcf/orders]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ orders: data ?? [] })
}
