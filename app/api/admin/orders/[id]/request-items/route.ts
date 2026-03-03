import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Welche Artikel sind von Storno-/Rücksendeanfrage betroffen?
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: rows } = await admin
    .from('order_request_items')
    .select('order_item_id, request_type, requested_quantity, admin_status, admin_note')
    .eq('order_id', id)
  if (!rows?.length) {
    return NextResponse.json({ cancellation: [], return: [] })
  }

  const itemIds = [...new Set(rows.map((r) => r.order_item_id))]
  const { data: items } = await admin.from('order_items').select('id, product_name, quantity').in('id', itemIds)
  const byId = new Map((items ?? []).map((i) => [i.id, { product_name: i.product_name, quantity: (i as { quantity?: number }).quantity ?? 0 }]))

  const asRow = (x: typeof rows[0]) => x as { admin_status?: string | null; admin_note?: string | null }
  const cancellation = rows.filter((r) => r.request_type === 'cancellation').map((row) => {
    const info = byId.get(row.order_item_id)
    return { order_item_id: row.order_item_id, product_name: info?.product_name ?? '', quantity: info?.quantity ?? 0, requested_quantity: (row as { requested_quantity?: number | null }).requested_quantity ?? null, admin_status: asRow(row).admin_status ?? null, admin_note: asRow(row).admin_note ?? null }
  })
  const returnItems = rows.filter((r) => r.request_type === 'return').map((row) => {
    const info = byId.get(row.order_item_id)
    return { order_item_id: row.order_item_id, product_name: info?.product_name ?? '', quantity: info?.quantity ?? 0, requested_quantity: (row as { requested_quantity?: number | null }).requested_quantity ?? null, admin_status: asRow(row).admin_status ?? null, admin_note: asRow(row).admin_note ?? null }
  })

  return NextResponse.json({ cancellation, return: returnItems })
}
