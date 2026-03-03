import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Alle Sendungen der Bestellung inkl. Zuordnung welche Artikel in welchem Paket sind.
 */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const resolved = typeof (context.params as Promise<unknown>)?.then === 'function'
    ? await (context.params as Promise<{ id?: string }>)
    : (context.params as { id?: string })
  const orderId = typeof resolved?.id === 'string' ? resolved.id.trim() : ''
  if (!orderId) return NextResponse.json({ error: 'orderId fehlt' }, { status: 400 })

  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()

  const { data: shipments, error: shipError } = await admin
    .from('order_shipments')
    .select('id, order_id, tracking_number, tracking_carrier, created_at')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true })

  if (shipError) {
    console.error('[shipment-items] GET order_shipments error:', shipError.code, shipError.message)
    return NextResponse.json({ shipments: [], itemsByShipment: {} })
  }
  const list = Array.isArray(shipments) ? shipments : []
  if (list.length === 0) {
    return NextResponse.json({ shipments: [], itemsByShipment: {} })
  }

  const shipmentIds = list.map((s) => s.id).filter((id): id is string => id != null && id !== '')
  let shipmentItems: { shipment_id: string; order_item_id: string; quantity: number }[] | null = null
  let itemsError: { code?: string; message: string } | null = null
  if (shipmentIds.length > 0) {
    const result = await admin
      .from('order_shipment_items')
      .select('shipment_id, order_item_id, quantity')
      .in('shipment_id', shipmentIds)
    shipmentItems = result.data
    itemsError = result.error
  }

  if (itemsError) {
    console.error('[shipment-items] GET order_shipment_items error:', itemsError.code, itemsError.message)
    return NextResponse.json({ shipments: list, itemsByShipment: {} })
  }

  const orderItemIds = [...new Set((shipmentItems ?? []).map((i) => i.order_item_id))]
  const { data: orderItems } = orderItemIds.length
    ? await admin.from('order_items').select('id, product_name, quantity').in('id', orderItemIds)
    : { data: [] }
  const itemsMap = new Map<string, { id: string; product_name: string; quantity: number }>(
    (orderItems ?? []).map((o) => [String(o.id).toLowerCase(), o as { id: string; product_name: string; quantity: number }])
  )

  const itemsByShipment: Record<string, { order_item_id: string; quantity: number; product_name: string }[]> = {}
  for (const s of list) {
    itemsByShipment[String(s.id)] = []
  }
  for (const si of shipmentItems ?? []) {
    const key = String(si.shipment_id)
    itemsByShipment[key] = itemsByShipment[key] ?? []
    itemsByShipment[key].push({
      order_item_id: si.order_item_id,
      quantity: si.quantity,
      product_name: itemsMap.get(String(si.order_item_id).toLowerCase())?.product_name ?? 'Unbekannt',
    })
  }

  const res = NextResponse.json({ shipments: list, itemsByShipment })
  res.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate')
  return res
}
