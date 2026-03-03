import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendCancellationApprovedEmail, sendCancellationRejectedEmail } from '@/lib/send-order-email'
import { writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * POST – Stornierungsanfrage annehmen oder ablehnen.
 * Body: { action: 'approve' | 'reject', reject_reason?: string, items?: [{ order_item_id, admin_status: 'approved'|'not_refundable', admin_note?: string }] }
 * Bei action=approve: items optional – pro Artikel Erstatten (approved) oder Nicht erstattungsfähig (not_refundable) festlegen.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const action = body.action === 'approve' ? 'approve' : body.action === 'reject' ? 'reject' : null
  if (!action) return NextResponse.json({ error: 'action muss "approve" oder "reject" sein' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: order } = await admin.from('orders').select('id, order_number, cancellation_requested_at, cancellation_request_status, status, customer_email, customer_name').eq('id', id).single()
  if (!order?.cancellation_requested_at) {
    return NextResponse.json({ error: 'Keine Stornierungsanfrage für diese Bestellung' }, { status: 400 })
  }
  if (order.cancellation_request_status === 'approved' || order.cancellation_request_status === 'rejected') {
    return NextResponse.json({ error: 'Anfrage wurde bereits bearbeitet' }, { status: 400 })
  }

  const itemsPayload = Array.isArray(body.items)
    ? body.items.filter((x: unknown) => x && typeof x === 'object' && 'order_item_id' in x && typeof (x as { order_item_id: unknown }).order_item_id === 'string')
    : []
  const itemAdminStatusMap = new Map<string, { admin_status: 'approved' | 'not_refundable'; admin_note?: string }>()
  for (const it of itemsPayload) {
    const o = it as { order_item_id: string; admin_status?: string; admin_note?: string }
    const st = o.admin_status === 'not_refundable' ? 'not_refundable' : 'approved'
    itemAdminStatusMap.set(o.order_item_id, {
      admin_status: st,
      admin_note: typeof o.admin_note === 'string' ? o.admin_note.trim().slice(0, 500) || undefined : undefined,
    })
  }

  const updates: Record<string, unknown> = { cancellation_request_status: action === 'approve' ? 'approved' : 'rejected' }
  if (action === 'approve') {
    const { data: requestItems } = await admin
      .from('order_request_items')
      .select('id, order_item_id, requested_quantity')
      .eq('order_id', id)
      .eq('request_type', 'cancellation')
    const { data: allOrderItems } = await admin.from('order_items').select('id, quantity, cancelled_quantity, item_status').eq('order_id', id)
    const itemsById = new Map((allOrderItems ?? []).map((i) => [i.id, i as { id: string; quantity: number; cancelled_quantity?: number; item_status?: string }]))

    if ((requestItems ?? []).length > 0) {
      for (const req of requestItems ?? []) {
        const adminEntry = itemAdminStatusMap.get(req.order_item_id)
        const status = adminEntry?.admin_status ?? 'approved'
        await admin
          .from('order_request_items')
          .update({
            admin_status: status,
            admin_note: adminEntry?.admin_note ?? null,
          })
          .eq('id', req.id)
        if (status === 'not_refundable') continue
        const oi = itemsById.get(req.order_item_id)
        if (!oi) continue
        const qty = Number(oi.quantity) || 0
        const already = Number(oi.cancelled_quantity) ?? 0
        const requestedQty = req.requested_quantity != null ? Math.min(Math.max(0, Math.floor(Number(req.requested_quantity))), Math.max(0, qty - already)) : qty - already
        const newCancelled = already + requestedQty
        await admin.from('order_items').update({ cancelled_quantity: newCancelled, item_status: newCancelled >= qty ? 'cancelled' : (oi.item_status ?? 'active') }).eq('id', req.order_item_id)
      }
      const { data: afterItems } = await admin.from('order_items').select('id, quantity, cancelled_quantity').eq('order_id', id)
      const allCancelled = (afterItems ?? []).length > 0 && (afterItems ?? []).every((i) => (Number((i as { cancelled_quantity?: number }).cancelled_quantity) ?? 0) >= Number((i as { quantity: number }).quantity))
      updates.status = allCancelled ? 'cancelled' : 'processing'
    } else {
      updates.status = 'cancelled'
    }
  } else if (action === 'reject') {
    updates.status = 'cancellation_rejected'
  }

  let error = (await admin.from('orders').update(updates).eq('id', id)).error
  if (error && (error.message?.includes('check constraint') || error.message?.includes('violates') || error.code === '23514')) {
    const fallback: Record<string, unknown> = { cancellation_request_status: 'rejected', status: 'processing' }
    error = (await admin.from('orders').update(fallback).eq('id', id)).error
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { staff } = await getAdminContext()
  const actor = { email: staff?.email, id: staff?.id }
  const newCancelStatus = action === 'approve' ? 'approved' : 'rejected'
  const oldCancelStatus = order.cancellation_request_status ?? null
  await writeAuditLog(admin, {
    entity_type: 'order',
    entity_id: id,
    action: 'update',
    field_name: 'cancellation_request_status',
    old_value: oldCancelStatus ?? '',
    new_value: newCancelStatus,
  }, actor)
  const newStatus = updates.status as string
  if (newStatus && newStatus !== order.status) {
    await writeAuditLog(admin, {
      entity_type: 'order',
      entity_id: id,
      action: 'update',
      field_name: 'status',
      old_value: order.status ?? '',
      new_value: newStatus,
    }, actor)
  }

  const rejectReason = typeof body.reject_reason === 'string' ? body.reject_reason.trim().slice(0, 2000) || null : null
  if (order.customer_email) {
    if (action === 'approve') {
      const emailResult = await sendCancellationApprovedEmail({
        customerEmail: order.customer_email,
        customerName: order.customer_name || 'Kunde',
        orderNumber: order.order_number || id.slice(0, 8),
      })
      if (!emailResult.ok) console.error('[cancel-request] E-Mail Storno angenommen:', emailResult.error)
    } else {
      const emailResult = await sendCancellationRejectedEmail({
        customerEmail: order.customer_email,
        customerName: order.customer_name || 'Kunde',
        orderNumber: order.order_number || id.slice(0, 8),
        reasonFromAdmin: rejectReason,
      })
      if (!emailResult.ok) console.error('[cancel-request] E-Mail Storno abgelehnt:', emailResult.error)
    }
  }

  return NextResponse.json({ success: true, action })
}
