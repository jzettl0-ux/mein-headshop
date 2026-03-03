/**
 * MCF-Order: Detail, Status-Update, Tracking
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('logistics')
    .from('mcf_orders')
    .select('*, vendor_accounts(id, company_name, contact_email)')
    .eq('mcf_order_id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.status && ['RECEIVED', 'PLANNING', 'SHIPPED', 'DELIVERED', 'UNFULFILLABLE'].includes(body.status)) {
    updates.status = body.status
  }
  if (body.tracking_number != null) updates.tracking_number = String(body.tracking_number)
  if (body.tracking_carrier != null) updates.tracking_carrier = String(body.tracking_carrier)
  if (body.fulfillment_fee_charged != null) updates.fulfillment_fee_charged = Number(body.fulfillment_fee_charged)

  if (Object.keys(updates).length <= 1) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('logistics')
    .from('mcf_orders')
    .update(updates)
    .eq('mcf_order_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
