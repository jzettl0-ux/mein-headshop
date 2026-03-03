import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Cross-Device Carts (cart_management.shopping_carts + item count) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ carts: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: carts, error } = await admin
      .schema('cart_management')
      .from('shopping_carts')
      .select('cart_id, customer_id, session_id, status, merged_into_cart_id, created_at, updated_at')
      .in('status', ['ACTIVE', 'ABANDONED'])
      .order('updated_at', { ascending: false })
      .limit(200)

    if (error) {
      console.error('[admin/carts]', error.message)
      return NextResponse.json({ carts: [] })
    }

    const cartIds = (carts ?? []).map((c) => c.cart_id)
    const itemCounts: Record<string, number> = {}
    if (cartIds.length > 0) {
      const { data: items } = await admin
        .schema('cart_management')
        .from('cart_items')
        .select('cart_id')
        .in('cart_id', cartIds)
      const byCart = new Map<string, number>()
      ;(items ?? []).forEach((r: { cart_id: string }) => {
        byCart.set(r.cart_id, (byCart.get(r.cart_id) ?? 0) + 1)
      })
      byCart.forEach((v, k) => { itemCounts[k] = v })
    }

    const list = (carts ?? []).map((c) => ({
      ...c,
      item_count: itemCounts[c.cart_id] ?? 0,
    }))
    return NextResponse.json({ carts: list })
  } catch (e) {
    console.error('[admin/carts]', e)
    return NextResponse.json({ carts: [] })
  }
}
