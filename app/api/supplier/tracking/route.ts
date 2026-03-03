import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendShippingNotificationEmail } from '@/lib/send-order-email'

export const dynamic = 'force-dynamic'

/**
 * Supplier Portal & Tracking – Webhook für Lieferanten.
 * Lieferanten senden Sendungsnummern an diesen Endpunkt; Bestellung wird aktualisiert und Kunde erhält Versandbestätigung.
 *
 * POST Body (JSON):
 *   order_number: string (oder order_id: string)
 *   tracking_number: string
 *   tracking_carrier?: string (z. B. DHL, DPD, GLS – Default: DHL)
 *
 * Sicherheit: Authorization: Bearer <SUPPLIER_TRACKING_SECRET> oder Header X-Supplier-Tracking-Token.
 * SUPPLIER_TRACKING_SECRET in .env setzen und an Lieferanten weitergeben.
 */
export async function POST(req: NextRequest) {
  const secret = process.env.SUPPLIER_TRACKING_SECRET
  if (secret?.trim()) {
    const authHeader = req.headers.get('authorization')
    const tokenHeader = req.headers.get('x-supplier-tracking-token')
    const provided = (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null) ?? tokenHeader?.trim()
    if (provided !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const orderNumber = typeof body.order_number === 'string' ? body.order_number.trim() : ''
  const orderId = typeof body.order_id === 'string' ? body.order_id.trim() : ''
  const trackingNumber = typeof body.tracking_number === 'string' ? body.tracking_number.trim() : ''
  const trackingCarrier = typeof body.tracking_carrier === 'string' ? body.tracking_carrier.trim() || 'DHL' : 'DHL'

  if (!trackingNumber) {
    return NextResponse.json({ error: 'tracking_number ist erforderlich' }, { status: 400 })
  }
  if (!orderNumber && !orderId) {
    return NextResponse.json({ error: 'order_number oder order_id ist erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  type OrderRow = { id: string; order_number: string; customer_name: string; customer_email: string; status: string }
  let order: OrderRow | null = null

  if (orderId) {
    const { data } = await admin.from('orders').select('id, order_number, customer_name, customer_email, status').eq('id', orderId).maybeSingle()
    if (data) order = data as OrderRow
  }
  if (!order && orderNumber) {
    const { data } = await admin.from('orders').select('id, order_number, customer_name, customer_email, status').eq('order_number', orderNumber).maybeSingle()
    if (data) order = data as OrderRow
  }
  if (!order && orderNumber) {
    const { data } = await admin.from('orders').select('id, order_number, customer_name, customer_email, status').ilike('order_number', orderNumber).maybeSingle()
    if (data) order = data as OrderRow
  }

  if (!order) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
  }

  const newStatus = !['delivered', 'cancelled'].includes(order.status) ? 'shipped' : order.status

  const { error: insertError } = await admin
    .from('order_shipments')
    .insert({ order_id: order.id, tracking_number: trackingNumber, tracking_carrier: trackingCarrier })

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 })
  }

  await admin
    .from('orders')
    .update({ status: newStatus, tracking_number: trackingNumber, tracking_carrier: trackingCarrier })
    .eq('id', order.id)

  if (!order.customer_email) {
    return NextResponse.json({
      ok: true,
      message: 'Tracking gespeichert. Keine Kunden-E-Mail – Versandbestätigung nicht gesendet.',
      order_number: order.order_number,
    })
  }

  const [shipmentsRes, itemsRes, totalsRes] = await Promise.all([
    admin.from('order_shipments').select('tracking_number, tracking_carrier').eq('order_id', order.id).order('created_at', { ascending: true }),
    admin.from('order_items').select('product_name, quantity, price, product_image').eq('order_id', order.id),
    admin.from('orders').select('subtotal, shipping_cost, total').eq('id', order.id).maybeSingle(),
  ])
  const shipments = shipmentsRes.data ?? []
  const items = (itemsRes.data ?? []).map((row: { product_name: string; quantity: number; price: number; product_image?: string | null }) => ({
    name: row.product_name,
    quantity: row.quantity,
    price: Number(row.price),
    product_image: row.product_image && String(row.product_image).trim() ? String(row.product_image).trim() : undefined,
  }))
  const totals = totalsRes.data as { subtotal?: number; shipping_cost?: number; total?: number } | null

  const emailResult = await sendShippingNotificationEmail({
    orderNumber: order.order_number,
    customerName: order.customer_name ?? '',
    customerEmail: order.customer_email,
    shipments: shipments.map((s: { tracking_number: string; tracking_carrier?: string | null }) => ({
      trackingNumber: s.tracking_number,
      trackingCarrier: s.tracking_carrier || undefined,
    })),
    items: items.length > 0 ? items : undefined,
    subtotal: totals?.subtotal != null ? Number(totals.subtotal) : undefined,
    shipping: totals?.shipping_cost != null ? Number(totals.shipping_cost) : undefined,
    total: totals?.total != null ? Number(totals.total) : undefined,
  })

  if (!emailResult.ok) {
    return NextResponse.json({
      ok: true,
      message: 'Tracking gespeichert. Versandbestätigung an Kunden konnte nicht gesendet werden.',
      email_error: emailResult.error,
      order_number: order.order_number,
    }, { status: 200 })
  }

  return NextResponse.json({
    ok: true,
    message: 'Tracking gespeichert und Versandbestätigung an Kunden gesendet.',
    order_number: order.order_number,
  })
}
