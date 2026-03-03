import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendShippingNotificationEmail } from '@/lib/send-order-email'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/order-tracking (nicht unter orders/, damit orders/[id] nicht greift)
 * Body: orderId oder order_number.
 * - Mit action: "send-email" → nur E-Mail mit allen Sendungsnummern senden.
 * - Mit trackingNumber (+ trackingCarrier) → Sendung hinzufügen, Status auf Versandt.
 */
export async function POST(req: NextRequest) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json(
        { error: 'SUPABASE_SERVICE_ROLE_KEY fehlt.' },
        { status: 503 }
      )
    }

    const body = await req.json().catch(() => ({}))
    const orderIdFromBody = typeof body.orderId === 'string' ? body.orderId.trim() : ''
    const orderNumberFromBody = typeof body.order_number === 'string' ? body.order_number.trim() : ''
    const trackingNumber = typeof body.trackingNumber === 'string' ? body.trackingNumber.trim() : ''
    const trackingCarrier = typeof body.trackingCarrier === 'string' ? body.trackingCarrier.trim() || 'DHL' : 'DHL'
    const sendEmailOnly = body.action === 'send-email' || body.sendEmailOnly === true

    if (!orderIdFromBody && !orderNumberFromBody) {
      return NextResponse.json({ error: 'orderId oder order_number im Body erforderlich' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    type OrderRow = { id: string; order_number: string; customer_name: string; customer_email: string; status: string; tracking_number: string | null }
    let order: OrderRow | null = null

    if (orderIdFromBody) {
      const res = await admin.from('orders').select('id, order_number, customer_name, customer_email, status, tracking_number').eq('id', orderIdFromBody).maybeSingle()
      if (res.data) order = res.data as OrderRow
    }
    if (!order && orderNumberFromBody) {
      const res = await admin.from('orders').select('id, order_number, customer_name, customer_email, status, tracking_number').eq('order_number', orderNumberFromBody).maybeSingle()
      if (res.data) order = res.data as OrderRow
    }
    if (!order && orderNumberFromBody) {
      const res = await admin.from('orders').select('id, order_number, customer_name, customer_email, status, tracking_number').ilike('order_number', orderNumberFromBody).maybeSingle()
      if (res.data) order = res.data as OrderRow
    }

    if (!order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    if (sendEmailOnly) {
      const [{ data: shipments }, { data: orderTotals }, { data: orderItems }] = await Promise.all([
        admin.from('order_shipments').select('tracking_number, tracking_carrier').eq('order_id', order.id).order('created_at', { ascending: true }),
        admin.from('orders').select('subtotal, shipping_cost, total').eq('id', order.id).maybeSingle(),
        admin.from('order_items').select('product_name, quantity, price, product_image').eq('order_id', order.id).order('id', { ascending: true }),
      ])

      if (!shipments?.length) {
        return NextResponse.json(
          { error: 'Keine Sendungsnummern für diese Bestellung. Zuerst Sendungen hinzufügen.' },
          { status: 400 }
        )
      }
      if (!order.customer_email) {
        return NextResponse.json({ error: 'Keine Kunden-E-Mail hinterlegt' }, { status: 400 })
      }

      const items = (orderItems || []).map((row: { product_name: string; quantity: number; price: number; product_image?: string | null }) => ({
        name: row.product_name,
        quantity: row.quantity,
        price: Number(row.price),
        product_image: row.product_image && String(row.product_image).trim() ? String(row.product_image).trim() : undefined,
      }))
      const totals = orderTotals as { subtotal?: number; shipping_cost?: number; total?: number } | null

      const result = await sendShippingNotificationEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        shipments: shipments.map((s) => ({
          trackingNumber: s.tracking_number,
          trackingCarrier: s.tracking_carrier || undefined,
        })),
        items: items.length > 0 ? items : undefined,
        subtotal: totals?.subtotal != null ? Number(totals.subtotal) : undefined,
        shipping: totals?.shipping_cost != null ? Number(totals.shipping_cost) : undefined,
        total: totals?.total != null ? Number(totals.total) : undefined,
      })

      if (!result.ok) {
        return NextResponse.json({ error: result.error || 'E-Mail-Versand fehlgeschlagen' }, { status: 500 })
      }
      return NextResponse.json({ ok: true, sent: true })
    }

    if (!trackingNumber) {
      return NextResponse.json({ error: 'trackingNumber ist erforderlich' }, { status: 400 })
    }

    const newStatus = !['delivered', 'cancelled'].includes(order.status) ? 'shipped' : order.status

    const { error: insertError } = await admin
      .from('order_shipments')
      .insert({ order_id: order.id, tracking_number: trackingNumber, tracking_carrier: trackingCarrier })

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const { error: updateError } = await admin
      .from('orders')
      .update({ status: newStatus, tracking_number: trackingNumber, tracking_carrier: trackingCarrier })
      .eq('id', order.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({ ok: true, status: newStatus })
  } catch (e: unknown) {
    console.error('Admin order-tracking error', e)
    return NextResponse.json(
      { error: e instanceof Error ? e.message : 'Fehler' },
      { status: 500 }
    )
  }
}
