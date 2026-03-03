import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { canAccessOrders } from '@/lib/admin-permissions'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

type BulkAction = 'ship' | 'mark_return_received' | 'update_status'

/**
 * POST – Bulk-Aktionen für Bestellungen.
 * Body: { action: 'ship' | 'mark_return_received' | 'update_status', ... }
 *
 * ship: { items: [{ orderId, trackingNumber, trackingCarrier? }] }
 * mark_return_received: { orderIds: string[] }
 * update_status: { orderIds: string[], status: string }
 */
export async function POST(req: NextRequest) {
  const { isAdmin, roles } = await getAdminContext()
  if (!isAdmin || !canAccessOrders(roles?.length ? roles : [])) {
    return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const action = typeof body.action === 'string' ? body.action.trim() : ''

  if (!action) {
    return NextResponse.json({ error: 'action fehlt' }, { status: 400 })
  }

  const { staff } = await getAdminContext()
  const admin = createSupabaseAdmin()
  const results: { orderId: string; ok: boolean; error?: string }[] = []
  const actor = { email: staff?.email ?? null, id: staff?.id ?? null }

  if (action === 'ship') {
    const items = Array.isArray(body.items) ? body.items : []
    if (items.length === 0) {
      return NextResponse.json({ error: 'items[] mit orderId und trackingNumber erforderlich' }, { status: 400 })
    }
    for (const item of items) {
      const orderId = typeof item.orderId === 'string' ? item.orderId.trim() : ''
      const trackingNumber = typeof item.trackingNumber === 'string' ? item.trackingNumber.trim() : ''
      const trackingCarrier = typeof item.trackingCarrier === 'string' ? item.trackingCarrier.trim() || 'DHL' : 'DHL'
      if (!orderId || !trackingNumber) {
        results.push({ orderId: orderId || '?', ok: false, error: 'orderId und trackingNumber erforderlich' })
        continue
      }
      const { data: order } = await admin
        .from('orders')
        .select('id, order_number, status, tracking_number, tracking_carrier')
        .eq('id', orderId)
        .maybeSingle()
      if (!order) {
        results.push({ orderId, ok: false, error: 'Bestellung nicht gefunden' })
        continue
      }
      const newStatus = !['delivered', 'cancelled'].includes(order.status) ? 'shipped' : order.status
      const oldStatus = order.status
      const oldTracking = (order as { tracking_number?: string }).tracking_number ?? null
      const { error: insertErr } = await admin.from('order_shipments').insert({
        order_id: order.id,
        tracking_number: trackingNumber,
        tracking_carrier: trackingCarrier,
      })
      if (insertErr) {
        results.push({ orderId, ok: false, error: insertErr.message })
        continue
      }
      const { error: updateErr } = await admin
        .from('orders')
        .update({ status: newStatus, tracking_number: trackingNumber, tracking_carrier: trackingCarrier })
        .eq('id', order.id)
      if (updateErr) {
        results.push({ orderId, ok: false, error: updateErr.message })
        continue
      }
      await writeAuditLog(admin, { entity_type: 'order', entity_id: orderId, action: 'update', field_name: 'status', old_value: oldStatus, new_value: newStatus }, actor)
      if (oldTracking !== trackingNumber) {
        await writeAuditLog(admin, { entity_type: 'order', entity_id: orderId, action: 'update', field_name: 'tracking_number', old_value: oldTracking, new_value: trackingNumber }, actor)
      }
      results.push({ orderId, ok: true })
    }
  } else if (action === 'mark_return_received') {
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds : []
    if (orderIds.length === 0) {
      return NextResponse.json({ error: 'orderIds[] erforderlich' }, { status: 400 })
    }
    for (const id of orderIds) {
      const orderId = typeof id === 'string' ? id.trim() : ''
      if (!orderId) continue
      const { data: order } = await admin
        .from('orders')
        .select('id, return_request_status')
        .eq('id', orderId)
        .single()
      if (!order) {
        results.push({ orderId, ok: false, error: 'Bestellung nicht gefunden' })
        continue
      }
      if (order.return_request_status !== 'approved') {
        results.push({ orderId, ok: false, error: 'Rücksendung muss angenommen sein' })
        continue
      }
      const { data: returnItems } = await admin
        .from('order_request_items')
        .select('order_item_id, requested_quantity')
        .eq('order_id', orderId)
        .eq('request_type', 'return')
      if (!returnItems?.length) {
        results.push({ orderId, ok: false, error: 'Keine Rücksende-Artikel' })
        continue
      }
      const { data: allItems } = await admin.from('order_items').select('id, quantity, returned_quantity, item_status').eq('order_id', orderId)
      const itemsById = new Map((allItems ?? []).map((i) => [i.id, i as { id: string; quantity: number; returned_quantity?: number; item_status?: string }]))
      let fail = false
      for (const ri of returnItems) {
        const oi = itemsById.get(ri.order_item_id)
        if (!oi) continue
        const qty = Number(oi.quantity) || 0
        const already = Number(oi.returned_quantity) ?? 0
        const reqQty = ri.requested_quantity != null ? Math.min(Math.max(0, Math.floor(Number(ri.requested_quantity))), qty - already) : qty - already
        const newReturned = already + reqQty
        const { error: upErr } = await admin
          .from('order_items')
          .update({ returned_quantity: newReturned, item_status: newReturned >= qty ? 'returned' : (oi.item_status ?? 'active') })
          .eq('id', ri.order_item_id)
        if (upErr) {
          results.push({ orderId, ok: false, error: upErr.message })
          fail = true
          break
        }
      }
      if (fail) continue
      const { data: afterItems } = await admin.from('order_items').select('quantity, returned_quantity').eq('order_id', orderId)
      const allReturned = afterItems?.length && afterItems.every((i) => (Number(i.returned_quantity) ?? 0) >= Number(i.quantity))
      if (allReturned) {
        const { data: o } = await admin.from('orders').select('status').eq('id', orderId).single()
        const prevStatus = (o as { status?: string } | null)?.status ?? null
        await admin.from('orders').update({ status: 'return_completed' }).eq('id', orderId)
        await writeAuditLog(admin, { entity_type: 'order', entity_id: orderId, action: 'update', field_name: 'status', old_value: prevStatus, new_value: 'return_completed' }, actor)
      }
      results.push({ orderId, ok: true })
    }
  } else if (action === 'update_status') {
    const orderIds = Array.isArray(body.orderIds) ? body.orderIds : []
    const status = typeof body.status === 'string' ? body.status.trim() : ''
    if (orderIds.length === 0 || !status) {
      return NextResponse.json({ error: 'orderIds[] und status erforderlich' }, { status: 400 })
    }
    for (const id of orderIds) {
      const orderId = typeof id === 'string' ? id.trim() : ''
      if (!orderId) continue
      const { data: prev } = await admin.from('orders').select('status').eq('id', orderId).single()
      const oldStatus = (prev as { status?: string } | null)?.status ?? null
      const { error } = await admin.from('orders').update({ status }).eq('id', orderId)
      if (!error) {
        await writeAuditLog(admin, { entity_type: 'order', entity_id: orderId, action: 'update', field_name: 'status', old_value: oldStatus, new_value: status }, actor)
      }
      results.push({ orderId, ok: !error, error: error?.message })
    }
  } else {
    return NextResponse.json({ error: 'Unbekannte action' }, { status: 400 })
  }

  const successCount = results.filter((r) => r.ok).length
  const failCount = results.filter((r) => !r.ok).length
  return NextResponse.json({
    ok: failCount === 0,
    successCount,
    failCount,
    results,
  })
}
