import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/account/subscriptions
 * Liste aller Abos des eingeloggten Kunden.
 */
export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: rows, error } = await admin
    .schema('cx')
    .from('subscriptions')
    .select('subscription_id, product_id, quantity, interval_days, discount_percentage, next_order_date, status, created_at')
    .eq('customer_id', user.id)
    .order('next_order_date', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const subs = rows ?? []
  if (subs.length === 0) return NextResponse.json([])

  const productIds = [...new Set(subs.map((s: { product_id: string }) => s.product_id).filter(Boolean))]
  const { data: products } = await admin
    .from('products')
    .select('id, name, slug, image_url, price')
    .in('id', productIds)

  const productMap = new Map((products ?? []).map((p: { id: string }) => [p.id, p]))
  const result = subs.map((s: { product_id: string; [k: string]: unknown }) => ({
    ...s,
    products: productMap.get(s.product_id) ?? null,
  }))

  return NextResponse.json(result)
}

/**
 * POST /api/account/subscriptions
 * Neues Subscribe & Save Abo anlegen.
 */
export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const { product_id, quantity = 1, interval_days = 30 } = body

  if (!product_id) {
    return NextResponse.json({ error: 'product_id fehlt' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: product } = await admin.from('products').select('id, name').eq('id', product_id).maybeSingle()
  if (!product) {
    return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })
  }

  const qty = Math.min(99, Math.max(1, Math.floor(Number(quantity) || 1)))
  const days = Math.min(90, Math.max(14, Math.floor(Number(interval_days) || 30)))
  const nextOrderDate = new Date()
  nextOrderDate.setDate(nextOrderDate.getDate() + days)

  const { data: sub, error } = await admin
    .schema('cx')
    .from('subscriptions')
    .insert({
      customer_id: user.id,
      product_id,
      quantity: qty,
      interval_days: days,
      discount_percentage: 5,
      next_order_date: nextOrderDate.toISOString().slice(0, 10),
      status: 'ACTIVE',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(sub)
}
