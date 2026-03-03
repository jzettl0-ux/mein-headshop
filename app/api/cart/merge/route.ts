/**
 * POST /api/cart/merge
 * Cart-Merge bei Login: Übergibt aktuelle Warenkorb-Items (z. B. aus LocalStorage),
 * merged sie in cart_management.shopping_carts für den eingeloggten User.
 * Body: { items: [{ product_id, quantity }] }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ ok: true })

  let body: { items?: { product_id?: string; quantity?: number }[] }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }
  const raw = Array.isArray(body?.items) ? body.items : []
  const items = raw
    .filter((r) => r?.product_id && Math.max(0, Math.floor(Number(r?.quantity) || 0)) > 0)
    .map((r) => ({ product_id: r!.product_id!, quantity: Math.min(99, Math.max(1, Math.floor(Number(r!.quantity) || 1))) }))

  if (items.length === 0) return NextResponse.json({ ok: true, cart_id: null })

  const admin = createSupabaseAdmin()

  const { data: existing } = await admin
    .schema('cart_management')
    .from('shopping_carts')
    .select('cart_id')
    .eq('customer_id', user.id)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  let cartId: string
  const now = new Date().toISOString()

  if (existing?.cart_id) {
    cartId = existing.cart_id
  } else {
    const { data: inserted, error } = await admin
      .schema('cart_management')
      .from('shopping_carts')
      .insert({ customer_id: user.id, status: 'ACTIVE', updated_at: now })
      .select('cart_id')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    cartId = (inserted as { cart_id: string }).cart_id
  }

  for (const it of items) {
    const { data: row } = await admin
      .schema('cart_management')
      .from('cart_items')
      .select('item_id, quantity')
      .eq('cart_id', cartId)
      .eq('product_id', it.product_id)
      .maybeSingle()

    const q = it.quantity
    if (row) {
      await admin
        .schema('cart_management')
        .from('cart_items')
        .update({ quantity: (row as { quantity: number }).quantity + q })
        .eq('cart_id', cartId)
        .eq('product_id', it.product_id)
    } else {
      await admin
        .schema('cart_management')
        .from('cart_items')
        .insert({ cart_id: cartId, product_id: it.product_id, quantity: q })
    }
  }

  await admin
    .schema('cart_management')
    .from('shopping_carts')
    .update({ updated_at: now })
    .eq('cart_id', cartId)

  return NextResponse.json({ ok: true, cart_id: cartId })
}
