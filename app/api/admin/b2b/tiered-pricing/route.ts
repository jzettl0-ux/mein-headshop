import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Staffelpreise (optional gefiltert nach product_id) */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const productId = request.nextUrl.searchParams.get('product_id')
  const admin = createSupabaseAdmin()

  let q = admin
    .schema('b2b')
    .from('tiered_pricing')
    .select('*, products(id, name, slug)')
    .order('product_id')
    .order('min_quantity', { ascending: true })

  if (productId) q = q.eq('product_id', productId)

  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Staffelpreis anlegen */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const productId = body.product_id
  const minQuantity = Math.floor(Number(body.min_quantity) ?? 1)
  const unitPrice = Number(body.unit_price)

  if (!productId || minQuantity < 1 || isNaN(unitPrice) || unitPrice < 0) {
    return NextResponse.json({ error: 'product_id, min_quantity (≥1) und unit_price (≥0) erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('b2b')
    .from('tiered_pricing')
    .insert({
      product_id: productId,
      min_quantity: minQuantity,
      unit_price: Math.round(unitPrice * 100) / 100,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
