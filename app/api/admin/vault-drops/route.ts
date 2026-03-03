import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json([])

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('gamification')
      .from('vault_drops')
      .select('drop_id, product_id, vendor_id, drop_price, total_units_available, units_sold, units_locked_in_carts, start_timestamp, end_timestamp, status, created_at')
      .order('start_timestamp', { ascending: false })

    if (error) {
      console.error('[admin/vault-drops]', error.message)
      return NextResponse.json([])
    }
    if (!rows?.length) return NextResponse.json([])

    const productIds = [...new Set(rows.map((r: { product_id: string }) => r.product_id))]
    const { data: prods } = await admin.from('products').select('id, name, slug, image_url, price').in('id', productIds)
    const prodMap = new Map((prods ?? []).map((p: { id: string }) => [p.id, p]))

    const result = rows.map((r: Record<string, unknown>) => ({
      ...r,
      products: prodMap.get(r.product_id as string) ?? null,
    }))
    return NextResponse.json(result)
  } catch (e) {
    console.error('[admin/vault-drops]', e)
    return NextResponse.json([])
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const productId = body.product_id
  const dropPrice = Number(body.drop_price)
  const totalUnits = Math.max(1, Math.floor(Number(body.total_units_available) ?? 1))
  const startAt = body.start_timestamp
  const endAt = body.end_timestamp
  if (!productId || typeof productId !== 'string')
    return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })
  if (isNaN(dropPrice) || dropPrice < 0)
    return NextResponse.json({ error: 'drop_price ungültig' }, { status: 400 })
  if (!startAt || !endAt)
    return NextResponse.json({ error: 'start_timestamp und end_timestamp erforderlich' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data: inserted, error } = await admin
    .schema('gamification')
    .from('vault_drops')
    .insert({
      product_id: productId,
      vendor_id: body.vendor_id || null,
      drop_price: Math.round(dropPrice * 100) / 100,
      total_units_available: totalUnits,
      start_timestamp: startAt,
      end_timestamp: endAt,
      status: 'SCHEDULED',
    })
    .select('drop_id, product_id, vendor_id, drop_price, total_units_available, units_sold, units_locked_in_carts, start_timestamp, end_timestamp, status, created_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const product = inserted ? (await admin.from('products').select('id, name, slug, image_url, price').eq('id', productId).single()).data : null
  return NextResponse.json({ ...inserted, products: product })
}
