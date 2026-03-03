import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendReturnApprovedEmail, sendReturnRejectedEmail } from '@/lib/send-order-email'
import { writeAuditLog } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * POST – Rücksendeanfrage annehmen oder ablehnen.
 * Body: { action: 'approve' | 'reject', return_shipping_code?: string, return_shipping_deduction_cents?: number, items?: [{ order_item_id, admin_status: 'approved'|'not_refundable', admin_note?: string }] }
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
  const { data: order } = await admin
    .from('orders')
    .select('id, order_number, status, return_requested_at, return_request_status, customer_email, customer_name')
    .eq('id', id)
    .single()
  if (!order?.return_requested_at) {
    return NextResponse.json({ error: 'Keine Rücksendeanfrage für diese Bestellung' }, { status: 400 })
  }
  if (order.return_request_status === 'approved' || order.return_request_status === 'rejected') {
    return NextResponse.json({ error: 'Anfrage wurde bereits bearbeitet' }, { status: 400 })
  }

  const returnShippingCode =
    action === 'approve' && typeof body.return_shipping_code === 'string'
      ? body.return_shipping_code.trim()
      : ''
  const returnShippingDeductionCents =
    action === 'approve' && typeof body.return_shipping_deduction_cents === 'number' && body.return_shipping_deduction_cents >= 0
      ? Math.round(body.return_shipping_deduction_cents)
      : null

  let returnShippingOptions: { carrier: string; label: string; price_cents: number }[] = []
  if (action === 'approve' && Array.isArray(body.return_shipping_options) && body.return_shipping_options.length > 0) {
    returnShippingOptions = body.return_shipping_options
      .filter((o: unknown) => o && typeof o === 'object' && 'carrier' in o && typeof (o as { carrier: unknown }).carrier === 'string')
      .map((o: { carrier: string; label?: string; price_cents?: number }) => ({
        carrier: String((o as { carrier: string }).carrier).trim().toLowerCase(),
        label: typeof (o as { label?: string }).label === 'string' ? (o as { label: string }).label.trim() : (o as { carrier: string }).carrier,
        price_cents: typeof (o as { price_cents?: number }).price_cents === 'number' && (o as { price_cents: number }).price_cents >= 0
          ? Math.round((o as { price_cents: number }).price_cents)
          : 0,
      }))
      .slice(0, 10)
  }

  if (action === 'approve' && !returnShippingCode) {
    return NextResponse.json({ error: 'Bitte Versandcode angeben (wird dem Kunden per E-Mail geschickt).' }, { status: 400 })
  }

  const newReturnStatus = action === 'approve' ? 'approved' : 'rejected'
  const oldReturnStatus = order.return_request_status ?? null

  const updates: Record<string, unknown> = {
    return_request_status: newReturnStatus,
  }
  if (action === 'approve') {
    updates.return_shipping_code = returnShippingCode
    updates.return_shipping_deduction_cents = returnShippingDeductionCents
    if (returnShippingOptions.length > 0) {
      updates.return_shipping_options = returnShippingOptions
    }
  } else if (action === 'reject') {
    updates.status = 'return_rejected'
  }

  const { error } = await admin.from('orders').update(updates).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (action === 'approve') {
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
    const { data: returnReqItems } = await admin
      .from('order_request_items')
      .select('id, order_item_id')
      .eq('order_id', id)
      .eq('request_type', 'return')
    for (const req of returnReqItems ?? []) {
      const adminEntry = itemAdminStatusMap.get(req.order_item_id)
      const status = adminEntry?.admin_status ?? 'approved'
      await admin
        .from('order_request_items')
        .update({ admin_status: status, admin_note: adminEntry?.admin_note ?? null })
        .eq('id', req.id)
    }
  }

  const { staff } = await getAdminContext()
  const actor = { email: staff?.email, id: staff?.id }
  await writeAuditLog(admin, {
    entity_type: 'order',
    entity_id: id,
    action: 'update',
    field_name: 'return_request_status',
    old_value: oldReturnStatus ?? '',
    new_value: newReturnStatus,
  }, actor)
  if (action === 'reject') {
    await writeAuditLog(admin, {
      entity_type: 'order',
      entity_id: id,
      action: 'update',
      field_name: 'status',
      old_value: order.status ?? '',
      new_value: 'return_rejected',
    }, actor)
  }

  const rejectReason = typeof body.reject_reason === 'string' ? body.reject_reason.trim().slice(0, 2000) || null : null
  if (action === 'reject' && order.customer_email) {
    const emailResult = await sendReturnRejectedEmail({
      customerEmail: order.customer_email,
      customerName: order.customer_name || 'Kunde',
      orderNumber: order.order_number || id.slice(0, 8),
      reasonFromAdmin: rejectReason,
    })
    if (!emailResult.ok) console.error('[return-request] E-Mail Rücksendung abgelehnt:', emailResult.error)
  }

  if (action === 'approve' && order.customer_email) {
    const emailResult = await sendReturnApprovedEmail({
      customerEmail: order.customer_email,
      customerName: order.customer_name || 'Kunde',
      orderNumber: order.order_number || id.slice(0, 8),
      returnShippingCode,
      returnShippingDeductionCents,
      returnShippingOptions: returnShippingOptions.length > 0 ? returnShippingOptions : undefined,
    })
    if (!emailResult.ok) {
      console.error('[return-request] E-Mail an Kunden fehlgeschlagen:', emailResult.error)
      return NextResponse.json({
        success: true,
        action,
        warning: 'Rücksendung angenommen, aber E-Mail an Kunden konnte nicht gesendet werden: ' + (emailResult.error || 'Unbekannt'),
      })
    }
  }

  return NextResponse.json({ success: true, action })
}
