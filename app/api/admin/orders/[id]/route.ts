import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { canAccessOrders } from '@/lib/admin-permissions'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { logEntityChanges } from '@/lib/audit-log'

export const dynamic = 'force-dynamic'

/**
 * PATCH – Bestellung aktualisieren (RBAC: Rollen mit Bestellzugriff).
 */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin, roles } = await getAdminContext()
  if (!isAdmin || !canAccessOrders(roles?.length ? roles : [])) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.status === 'string' && body.status.trim()) updates.status = body.status.trim()
  if (typeof body.processing_status === 'string') updates.processing_status = body.processing_status === '' ? null : body.processing_status
  if (typeof body.processing_notes === 'string') updates.processing_notes = body.processing_notes === '' ? null : body.processing_notes.trim().slice(0, 2000) || null
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Nichts zu ändern' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: currentOrder } = await admin.from('orders').select('status, payment_status, processing_status').eq('id', id).single()
  const oldRecord = currentOrder ? { status: currentOrder.status, payment_status: (currentOrder as { payment_status?: string }).payment_status, processing_status: (currentOrder as { processing_status?: string }).processing_status } : {}

  if (updates.status === 'cancelled') {
    const { data: order } = await admin.from('orders').select('id, status, payment_status').eq('id', id).single()
    const wasPaid = (order as { payment_status?: string } | null)?.payment_status === 'paid'
    const notShipped = !['shipped', 'delivered'].includes((order as { status?: string } | null)?.status ?? '')
    if (order && wasPaid && notShipped) {
      const { error: rpcErr } = await admin.rpc('increment_stock_for_order', { p_order_id: id })
      if (rpcErr) console.warn('increment_stock_for_order:', rpcErr.message)
    }
  }

  const { data, error } = await admin.from('orders').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const newRecord = { ...oldRecord, ...updates }
  const { staff } = await getAdminContext()
  await logEntityChanges(admin, 'order', id, oldRecord, newRecord, { email: staff?.email, id: staff?.id })
  return NextResponse.json(data)
}
