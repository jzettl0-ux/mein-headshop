import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.drop_price === 'number' && body.drop_price >= 0) updates.drop_price = Math.round(body.drop_price * 100) / 100
  if (typeof body.total_units_available === 'number' && body.total_units_available > 0) updates.total_units_available = Math.floor(body.total_units_available)
  if (body.start_timestamp) updates.start_timestamp = body.start_timestamp
  if (body.end_timestamp) updates.end_timestamp = body.end_timestamp
  if (['SCHEDULED', 'ACTIVE', 'SOLD_OUT', 'CLOSED'].includes(body.status)) updates.status = body.status
  if (Object.keys(updates).length === 0)
    return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data: row, error } = await admin
    .schema('gamification')
    .from('vault_drops')
    .update(updates)
    .eq('drop_id', id)
    .select('drop_id, product_id, vendor_id, drop_price, total_units_available, units_sold, units_locked_in_carts, start_timestamp, end_timestamp, status, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const product = row?.product_id ? (await admin.from('products').select('id, name, slug, image_url, price').eq('id', row.product_id).single()).data : null
  return NextResponse.json({ ...row, products: product })
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('gamification').from('vault_drops').delete().eq('drop_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
