import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** PATCH – Lightning Deal aktualisieren */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (typeof body.deal_price === 'number' && body.deal_price >= 0) updates.deal_price = Math.round(body.deal_price * 100) / 100
  if (typeof body.original_price === 'number' && body.original_price >= 0) updates.original_price = Math.round(body.original_price * 100) / 100
  if (typeof body.quantity_total === 'number' && body.quantity_total > 0) updates.quantity_total = Math.floor(body.quantity_total)
  if (body.start_at) updates.start_at = body.start_at
  if (body.end_at) updates.end_at = body.end_at
  if (['scheduled', 'active', 'ended', 'cancelled'].includes(body.status)) updates.status = body.status

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: row, error } = await admin
    .schema('promotions')
    .from('lightning_deals')
    .update(updates)
    .eq('deal_id', id)
    .select('deal_id, product_id, deal_price, original_price, quantity_total, quantity_claimed, start_at, end_at, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const product = row?.product_id ? (await admin.from('products').select('id, name, slug, image_url, price').eq('id', row.product_id).single()).data : null
  return NextResponse.json({ ...row, products: product })
}

/** DELETE – Lightning Deal löschen */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('promotions').from('lightning_deals').delete().eq('deal_id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
