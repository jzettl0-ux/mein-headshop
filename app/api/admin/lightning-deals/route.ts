import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Alle Lightning Deals */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json([])

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('promotions')
      .from('lightning_deals')
      .select('deal_id, product_id, deal_price, original_price, quantity_total, quantity_claimed, start_at, end_at, status, created_at')
      .order('start_at', { ascending: false })

    if (error) {
      console.error('[admin/lightning-deals]', error.message)
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
    console.error('[admin/lightning-deals]', e)
    return NextResponse.json([])
  }
}

/** POST – Lightning Deal anlegen */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const productId = body.product_id
  const dealPrice = Number(body.deal_price)
  const originalPrice = Number(body.original_price)
  const quantityTotal = Math.max(1, Math.floor(Number(body.quantity_total) ?? 1))
  const startAt = body.start_at
  const endAt = body.end_at

  if (!productId || typeof productId !== 'string') {
    return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })
  }
  if (isNaN(dealPrice) || dealPrice < 0) {
    return NextResponse.json({ error: 'deal_price ungültig' }, { status: 400 })
  }
  if (isNaN(originalPrice) || originalPrice < 0) {
    return NextResponse.json({ error: 'original_price ungültig' }, { status: 400 })
  }
  if (!startAt || !endAt) {
    return NextResponse.json({ error: 'start_at und end_at erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: inserted, error } = await admin
    .schema('promotions')
    .from('lightning_deals')
    .insert({
      product_id: productId,
      deal_price: Math.round(dealPrice * 100) / 100,
      original_price: Math.round(originalPrice * 100) / 100,
      quantity_total: quantityTotal,
      start_at: startAt,
      end_at: endAt,
      status: 'scheduled',
    })
    .select('deal_id, product_id, deal_price, original_price, quantity_total, quantity_claimed, start_at, end_at, status, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const product = inserted ? (await admin.from('products').select('id, name, slug, image_url, price').eq('id', productId).single()).data : null
  return NextResponse.json({ ...inserted, products: product })
}
