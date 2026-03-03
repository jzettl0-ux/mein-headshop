import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET /api/account/orders/[id]/request-items
 * Liefert die aktuell angefragten Mengen (Storno/Rücksendung) für den Kunden – zum Vorausfüllen bei „Weitere Artikel hinzufügen“.
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(context.params)
    const id = params?.id
    if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

    const { data: order, error: orderErr } = await supabase
      .from('orders')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (orderErr || !order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
    }

    const admin = createSupabaseAdmin()
    const { data: rows } = await admin
      .from('order_request_items')
      .select('order_item_id, request_type, requested_quantity, admin_status')
      .eq('order_id', id)

    if (!rows?.length) {
      return NextResponse.json({ cancellation: [], return: [] })
    }

    const itemIds = [...new Set(rows.map((r) => r.order_item_id))]
    const { data: items } = await admin.from('order_items').select('id, product_name, quantity, cancelled_quantity, returned_quantity').in('id', itemIds)
    const byId = new Map(
      (items ?? []).map((i) => [
        i.id,
        {
          product_name: i.product_name,
          quantity: (i as { quantity?: number }).quantity ?? 0,
          cancelled_quantity: (i as { cancelled_quantity?: number | null }).cancelled_quantity ?? 0,
          returned_quantity: (i as { returned_quantity?: number | null }).returned_quantity ?? 0,
        },
      ])
    )

    const cancellation = rows
      .filter((r) => r.request_type === 'cancellation')
      .map((r) => {
        const info = byId.get(r.order_item_id)
        const maxCancel = info ? Math.max(0, info.quantity - info.cancelled_quantity) : 0
        const reqQty = (r as { requested_quantity?: number | null }).requested_quantity ?? null
        const adminStatus = (r as { admin_status?: string | null }).admin_status
        return {
          order_item_id: r.order_item_id,
          product_name: info?.product_name ?? '',
          quantity: info?.quantity ?? 0,
          max_cancel: maxCancel,
          requested_quantity: reqQty != null ? reqQty : maxCancel,
          admin_status: adminStatus === 'not_refundable' ? 'not_refundable' : undefined,
        }
      })

    const returnItems = rows
      .filter((r) => r.request_type === 'return')
      .map((r) => {
        const info = byId.get(r.order_item_id)
        const maxReturn = info ? Math.max(0, info.quantity - info.returned_quantity) : 0
        const reqQty = (r as { requested_quantity?: number | null }).requested_quantity ?? null
        const adminStatus = (r as { admin_status?: string | null }).admin_status
        return {
          order_item_id: r.order_item_id,
          product_name: info?.product_name ?? '',
          quantity: info?.quantity ?? 0,
          max_return: maxReturn,
          requested_quantity: reqQty != null ? reqQty : maxReturn,
          admin_status: adminStatus === 'not_refundable' ? 'not_refundable' : undefined,
        }
      })

    return NextResponse.json({ cancellation, return: returnItems })
  } catch (e: unknown) {
    console.error('Request items route error', e)
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Fehler' }, { status: 500 })
  }
}
