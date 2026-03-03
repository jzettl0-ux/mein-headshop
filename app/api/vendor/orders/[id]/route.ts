import { NextRequest, NextResponse } from 'next/server'
import { requireVendor } from '@/lib/vendor-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Bestelldetail (nur eigene Zeilen) */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireVendor()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await Promise.resolve(context.params)
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()

  try {
    const { data: order } = await admin
      .from('orders')
      .select('id, order_number, status, total, shipping_address, created_at')
      .eq('id', id)
      .single()

    if (!order) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })

    const { data: items } = await admin
      .from('order_items')
      .select(`
        id,
        quantity,
        price,
        status,
        products (id, name)
      `)
      .eq('order_id', id)
      .eq('vendor_id', auth.vendorId)

    const vendorTotal = (items ?? []).reduce((sum, i) => sum + (Number(i.price) || 0) * (Number(i.quantity) || 1), 0)

    return NextResponse.json({
      ...order,
      items: items ?? [],
      vendor_total: vendorTotal,
    })
  } catch (e) {
    console.error('[vendor/orders/[id]]', e)
    return NextResponse.json({ error: 'Fehler beim Laden' }, { status: 500 })
  }
}
