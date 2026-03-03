import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getDhlTrackingStatus } from '@/lib/dhl-tracking'

/**
 * GET /api/cron/check-tracking?secret=DEIN_CRON_SECRET
 * Prüft alle Bestellungen mit Status "Versandt" und DHL-Sendungsnummer.
 * - Orders: Wenn DHL meldet "zugestellt", wird orders.status auf "delivered" gesetzt.
 * - order_shipments: delivered_at wird pro Sendung gesetzt (Phase 2.3).
 * Aufruf z. B. per Vercel Cron (täglich) – secret schützt vor unbefugtem Aufruf.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()

  // 1) Bestellungen mit tracking_number direkt auf orders
  const { data: orders, error } = await admin
    .from('orders')
    .select('id, order_number, tracking_number, tracking_carrier')
    .eq('status', 'shipped')
    .not('tracking_number', 'is', null)

  if (error || !orders?.length) {
    return NextResponse.json({ checked: 0, updated: 0, shipmentsUpdated: 0 })
  }

  let updated = 0
  let shipmentsUpdated = 0
  const dhlOrders = orders.filter((o) => (o.tracking_carrier || 'DHL').toUpperCase() === 'DHL')

  for (const order of dhlOrders) {
    const status = await getDhlTrackingStatus(order.tracking_number!)
    if (status === 'delivered') {
      const { error: updateErr } = await admin
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', order.id)
      if (!updateErr) updated++

      // order_shipments.delivered_at setzen (Phase 2.3)
      const { error: shipErr } = await admin
        .from('order_shipments')
        .update({ delivered_at: new Date().toISOString() })
        .eq('order_id', order.id)
        .eq('tracking_number', order.tracking_number)
      if (!shipErr) shipmentsUpdated++
    }
  }

  // 2) Zusätzlich: order_shipments ohne delivered_at prüfen (Multi-Shipment)
  const { data: shipments } = await admin
    .from('order_shipments')
    .select('id, order_id, tracking_number, tracking_carrier')
    .is('delivered_at', null)
    .eq('tracking_carrier', 'DHL')

  for (const s of shipments || []) {
    if (!s.tracking_number) continue
    const status = await getDhlTrackingStatus(s.tracking_number)
    if (status === 'delivered') {
      await admin
        .from('order_shipments')
        .update({ delivered_at: new Date().toISOString() })
        .eq('id', s.id)
      shipmentsUpdated++

      // Order prüfen: Wenn alle Sendungen zugestellt, Order auf delivered
      const { data: ord } = await admin.from('orders').select('status').eq('id', s.order_id).single()
      const { data: allShips } = await admin
        .from('order_shipments')
        .select('id, delivered_at')
        .eq('order_id', s.order_id)
      const allDelivered = allShips?.every((x) => x.delivered_at != null)
      if (allDelivered && ord?.status === 'shipped') {
        await admin.from('orders').update({ status: 'delivered' }).eq('id', s.order_id)
        updated++
      }
    }
  }

  return NextResponse.json({
    checked: dhlOrders.length + (shipments?.length ?? 0),
    updated,
    shipmentsUpdated,
    message:
      updated || shipmentsUpdated
        ? `${updated} Bestellung(en), ${shipmentsUpdated} Sendung(en) auf „Zugestellt“ gesetzt.`
        : 'Keine Zustellungen erkannt.',
  })
}
