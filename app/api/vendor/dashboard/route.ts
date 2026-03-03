import { NextResponse } from 'next/server'
import { requireVendor } from '@/lib/vendor-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Dashboard-KPIs für Vendor (Stub: Placeholder-Werte) */
export async function GET() {
  const auth = await requireVendor()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const admin = createSupabaseAdmin()

  // Offene Bestellungen: order_items mit vendor_id, wo order noch nicht shipped
  let ordersPending = 0
  try {
    const { data: items } = await admin
      .from('order_items')
      .select('order_id')
      .eq('vendor_id', auth.vendorId)
    const ids = [...new Set((items ?? []).map((i) => i.order_id).filter(Boolean))]
    if (ids.length > 0) {
      const { data: ords } = await admin
        .from('orders')
        .select('id, status')
        .in('id', ids)
      ordersPending = (ords ?? []).filter((o) => {
        const s = o.status ?? ''
        return s && !['shipped', 'delivered', 'cancelled'].includes(s)
      }).length
    }
  } catch {
    ordersPending = 0
  }

  const revenueToday = 0

  return NextResponse.json({
    orders_pending: ordersPending,
    revenue_today: revenueToday,
    alerts: 0,
  })
}
