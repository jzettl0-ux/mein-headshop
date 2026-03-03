import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST – Rücksendung eingegangen: die zur Rücksendung angefragten Artikel werden auf "zurückgesendet" gesetzt.
 * Nur wenn die Rücksendeanfrage bereits angenommen (return_request_status = approved) ist.
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

  const admin = createSupabaseAdmin()
  const { data: order } = await admin
    .from('orders')
    .select('id, return_request_status')
    .eq('id', id)
    .single()

  if (!order) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
  if (order.return_request_status !== 'approved') {
    return NextResponse.json(
      { error: 'Rücksendung muss zuerst angenommen sein. Erst dann kann "Rücksendung eingegangen" gesetzt werden.' },
      { status: 400 }
    )
  }

  const { data: returnRequestItems } = await admin
    .from('order_request_items')
    .select('order_item_id, requested_quantity, admin_status')
    .eq('order_id', id)
    .eq('request_type', 'return')

  const toProcess = (returnRequestItems ?? []).filter((r) => (r as { admin_status?: string | null }).admin_status !== 'not_refundable')
  if (toProcess.length === 0) {
    return NextResponse.json({ error: 'Keine Artikel für diese Rücksendung hinterlegt oder alle als nicht erstattungsfähig markiert.' }, { status: 400 })
  }

  const { data: allOrderItems } = await admin.from('order_items').select('id, quantity, returned_quantity, item_status').eq('order_id', id)
  const itemsById = new Map((allOrderItems ?? []).map((i) => [i.id, i as { id: string; quantity: number; returned_quantity?: number; item_status?: string }]))

  for (const req of toProcess) {
    const oi = itemsById.get(req.order_item_id)
    if (!oi) continue
    const qty = Number(oi.quantity) || 0
    const already = Number(oi.returned_quantity) ?? 0
    const requestedQty = req.requested_quantity != null ? Math.min(Math.max(0, Math.floor(Number(req.requested_quantity))), Math.max(0, qty - already)) : qty - already
    const newReturned = already + requestedQty
    const { error: upErr } = await admin.from('order_items').update({ returned_quantity: newReturned, item_status: newReturned >= qty ? 'returned' : (oi.item_status ?? 'active') }).eq('id', req.order_item_id)
    if (upErr) {
      console.error('[mark-return-received] order_items update:', upErr)
      return NextResponse.json({ error: upErr.message }, { status: 500 })
    }
  }

  const { data: afterItems } = await admin.from('order_items').select('id, quantity, returned_quantity').eq('order_id', id)
  const allReturned = (afterItems ?? []).length > 0 && (afterItems ?? []).every((i) => (Number((i as { returned_quantity?: number }).returned_quantity) ?? 0) >= Number((i as { quantity: number }).quantity))

  if (allReturned) {
    await admin.from('orders').update({ status: 'return_completed' }).eq('id', id)
  }

  // Phase 11.1: Return-Inspection anlegen (wenn noch keines existiert)
  const { data: existing } = await admin.schema('advanced_ops').from('return_inspections').select('id').eq('order_id', id).maybeSingle()
  if (!existing) {
    await admin.schema('advanced_ops').from('return_inspections').insert({ order_id: id, status: 'received' })
  }

  return NextResponse.json({ success: true, message: 'Rücksendung als eingegangen markiert.' })
}
