import { NextResponse } from 'next/server'
import { requireVendor } from '@/lib/vendor-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Bestellungen des Vendors (Stub: aus order_items mit vendor_id) */
export async function GET() {
  const auth = await requireVendor()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = createSupabaseAdmin()

  try {
    const { data: items } = await admin
      .from('order_items')
      .select('id, order_id, quantity, price')
      .eq('vendor_id', auth.vendorId)
      .limit(200)

    const orderIds = [...new Set((items ?? []).map((i) => i.order_id).filter(Boolean))]
    if (orderIds.length === 0) return NextResponse.json({ orders: [] })

    const { data: ordersData } = await admin
      .from('orders')
      .select('id, order_number, status, total, created_at')
      .in('id', orderIds)

    const orderMap = new Map((ordersData ?? []).map((o) => [o.id, { ...o, items: [] as any[] }]))
    for (const item of items ?? []) {
      const o = orderMap.get(item.order_id)
      if (o) o.items.push(item)
    }

    const orders = Array.from(orderMap.values()).sort(
      (a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
    )

    return NextResponse.json({ orders })
  } catch (e) {
    console.error('[vendor/orders]', e)
    return NextResponse.json({ orders: [] })
  }
}
