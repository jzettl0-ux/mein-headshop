import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { writeAuditLog } from '@/lib/audit-log'
import { createServerSupabase } from '@/lib/supabase-server'
import { sendShippingNotificationEmail } from '@/lib/send-order-email'

export const dynamic = 'force-dynamic'

/**
 * POST – Admin: Sendungsnummer speichern ODER nur E-Mail mit allen Sendungsnummern senden.
 * URL: /api/admin/orders/[id]/tracking (id = echte Bestell-UUID).
 * Body: action: "send-email" = nur E-Mail; sonst trackingNumber + trackingCarrier = Sendung hinzufügen.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { isAdmin } = await getAdminContext()
    if (!isAdmin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const trackingNumber = typeof body.trackingNumber === 'string' ? body.trackingNumber.trim() : ''
    const trackingCarrier = typeof body.trackingCarrier === 'string' ? body.trackingCarrier.trim() || 'DHL' : 'DHL'
    const sendEmailOnly = body.action === 'send-email' || body.sendEmailOnly === true

    const resolvedParams = await Promise.resolve(context.params)
    const pathId = resolvedParams?.id
    let id = (pathId && typeof pathId === 'string' ? pathId.trim() : '') || (typeof body.orderId === 'string' ? body.orderId.trim() : '')
    if (!id && req.url) {
      const segments = new URL(req.url).pathname.split('/').filter(Boolean)
      const idx = segments.indexOf('orders')
      if (idx >= 0 && segments[idx + 1] && segments[idx + 1] !== 'tracking') id = segments[idx + 1]
    }
    try { id = id ? decodeURIComponent(id) : id } catch { /* keep id */ }
    if (!id) {
      return NextResponse.json({ error: 'Bestell-ID fehlt' }, { status: 400 })
    }

    if (!sendEmailOnly && !trackingNumber) {
      return NextResponse.json({ error: 'trackingNumber ist erforderlich' }, { status: 400 })
    }

    type OrderRow = { id: string; order_number: string; customer_name: string; customer_email: string; status: string; tracking_number: string | null }
    let order: OrderRow | null = null
    let foundWithAdmin = false
    let adminByIdError: string | null = null

    if (hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()
      const byId = await admin
        .from('orders')
        .select('id, order_number, customer_name, customer_email, status, tracking_number')
        .eq('id', id)
        .maybeSingle()
      if (byId.error) {
        adminByIdError = byId.error.message
        console.error('Tracking [id]: Admin byId error', { id, error: byId.error.message, code: byId.error.code })
      }
      if (byId.data) {
        order = byId.data as OrderRow
        foundWithAdmin = true
      }
      if (!order && body.order_number) {
        const byNumber = await admin
          .from('orders')
          .select('id, order_number, customer_name, customer_email, status, tracking_number')
          .eq('order_number', String(body.order_number).trim())
          .maybeSingle()
        if (byNumber.error) {
          console.error('Tracking [id]: Admin byOrderNumber error', { order_number: body.order_number, error: byNumber.error.message })
        }
        if (byNumber.data) {
          order = byNumber.data as OrderRow
          foundWithAdmin = true
        }
      }
    }

    if (!order) {
      const supabase = await createServerSupabase()
      const sessionResult = await supabase
        .from('orders')
        .select('id, order_number, customer_name, customer_email, status, tracking_number')
        .eq('id', id)
        .maybeSingle()
      if (sessionResult.error) {
        console.error('Tracking [id]: Session byId error', { id, error: sessionResult.error.message })
      }
      if (sessionResult.data) order = sessionResult.data as OrderRow
      if (!order && body.order_number) {
        const orderNum = String(body.order_number).trim()
        const { data: orderByNum, error: orderByNumError } = await supabase
          .from('orders')
          .select('id, order_number, customer_name, customer_email, status, tracking_number')
          .eq('order_number', orderNum)
          .maybeSingle()
        if (orderByNumError) console.error('Tracking [id]: Session byOrderNumber error', { order_number: orderNum, error: orderByNumError.message })
        if (orderByNum) order = orderByNum as OrderRow
      }
    }

    if (!order) {
      console.warn('Tracking: order not found', { id, hasAdmin: hasSupabaseAdmin(), pathId: resolvedParams?.id })
      const payload: { error: string; debug?: string } = {
        error: 'Bestellung nicht gefunden. Bitte Seite neu laden und erneut versuchen.',
      }
      if (process.env.NODE_ENV === 'development' && adminByIdError) {
        payload.debug = adminByIdError
      }
      return NextResponse.json(payload, { status: 404 })
    }

    if (sendEmailOnly) {
      const client = foundWithAdmin && hasSupabaseAdmin() ? createSupabaseAdmin() : await createServerSupabase()
      const [{ data: shipments }, { data: orderTotals }, { data: orderItems }] = await Promise.all([
        client.from('order_shipments').select('tracking_number, tracking_carrier').eq('order_id', order.id).order('created_at', { ascending: true }),
        client.from('orders').select('subtotal, shipping_cost, total').eq('id', order.id).maybeSingle(),
        client.from('order_items').select('product_name, quantity, price, product_image').eq('order_id', order.id).order('id', { ascending: true }),
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

    const orderIdToUse = order.id
    const newStatus = !['delivered', 'cancelled'].includes(order.status) ? 'shipped' : order.status
    const oldStatus = order.status
    const oldTracking = order.tracking_number ?? null

    const client = foundWithAdmin && hasSupabaseAdmin() ? createSupabaseAdmin() : await createServerSupabase()

    const { data: newShipment, error: insertError } = await client
      .from('order_shipments')
      .insert({
        order_id: orderIdToUse,
        tracking_number: trackingNumber,
        tracking_carrier: trackingCarrier,
      })
      .select('id')
      .single()

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    const items = Array.isArray(body.items) ? body.items : []
    if (newShipment?.id && items.length > 0) {
      const byItem: Record<string, number> = {}
      for (const r of items) {
        if (!r || typeof r !== 'object' || typeof (r as { order_item_id?: unknown }).order_item_id !== 'string') continue
        const oiId = String((r as { order_item_id: string }).order_item_id).trim()
        const q = Math.max(1, Math.floor(Number((r as { quantity?: unknown }).quantity)))
        if (oiId) byItem[oiId] = (byItem[oiId] ?? 0) + q
      }
      const rows = Object.entries(byItem).map(([order_item_id, quantity]) => ({
        shipment_id: newShipment.id,
        order_item_id,
        quantity,
      }))
      if (rows.length > 0) {
        await client.from('order_shipment_items').insert(rows)
      }
    }

    const { error: updateError } = await client
      .from('orders')
      .update({
        status: newStatus,
        tracking_number: trackingNumber,
        tracking_carrier: trackingCarrier,
      })
      .eq('id', orderIdToUse)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    if (foundWithAdmin && hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()
      const { staff } = await getAdminContext()
      const actor = { email: staff?.email, id: staff?.id }
      if (oldStatus !== newStatus) {
        await writeAuditLog(admin, { entity_type: 'order', entity_id: orderIdToUse, action: 'update', field_name: 'status', old_value: oldStatus, new_value: newStatus }, actor)
      }
      if (oldTracking !== trackingNumber) {
        await writeAuditLog(admin, { entity_type: 'order', entity_id: orderIdToUse, action: 'update', field_name: 'tracking_number', old_value: oldTracking, new_value: trackingNumber }, actor)
      }
    }

    return NextResponse.json({
      ok: true,
      status: newStatus,
    })
  } catch (e: any) {
    console.error('Admin tracking route error', e)
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}
