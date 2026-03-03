import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST – Wareneingang aus einem Einkauf buchen.
 * Body: { purchase_id: string, entries: [{ purchase_item_id: string, quantity: number }] }
 * Erhöht quantity_received und products.stock entsprechend.
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  let body: { purchase_id?: string; entries?: { purchase_item_id: string; quantity: number }[] }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const purchaseId = body.purchase_id?.trim()
  const raw = body.entries
  if (!purchaseId || !Array.isArray(raw) || raw.length === 0) {
    return NextResponse.json(
      { error: 'purchase_id und entries (Array mit purchase_item_id + quantity) erforderlich' },
      { status: 400 }
    )
  }

  const entries: { purchase_item_id: string; quantity: number }[] = []
  for (const row of raw) {
    const id = typeof row.purchase_item_id === 'string' ? row.purchase_item_id.trim() : ''
    const qty = Math.max(0, Math.round(Number(row.quantity) || 0))
    if (!id || qty === 0) continue
    entries.push({ purchase_item_id: id, quantity: qty })
  }
  if (entries.length === 0) {
    return NextResponse.json({ error: 'Keine gültigen Einträge' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  const itemIds = entries.map((e) => e.purchase_item_id)
  const { data: items, error: fetchErr } = await admin
    .from('purchase_items')
    .select('id, purchase_id, product_id, quantity, quantity_received, unit_price_eur, is_bundle, bundle_size')
    .eq('purchase_id', purchaseId)
    .in('id', itemIds)

  if (fetchErr) return NextResponse.json({ error: fetchErr.message }, { status: 500 })
  type Item = { id: string; product_id: string | null; quantity: number; quantity_received?: number; unit_price_eur?: number; is_bundle?: boolean; bundle_size?: number | null }
  const itemMap = new Map<string, Item>((items ?? []).map((i: Item) => [i.id, i]))

  for (const e of entries) {
    const item = itemMap.get(e.purchase_item_id)
    if (!item || !item.product_id) continue
    const curReceived = Number(item.quantity_received ?? 0)
    const maxQty = Number(item.quantity ?? 0) - curReceived
    const toAdd = Math.min(e.quantity, maxQty)
    if (toAdd <= 0) continue

    const newReceived = curReceived + toAdd
    const { error: upItemErr } = await admin
      .from('purchase_items')
      .update({ quantity_received: newReceived })
      .eq('id', e.purchase_item_id)

    if (upItemErr) return NextResponse.json({ error: upItemErr.message }, { status: 500 })

    const { data: prod } = await admin.from('products').select('stock').eq('id', item.product_id).single()
    const curStock = Math.max(0, Number(prod?.stock ?? 0))
    const updates: { stock: number; cost_price?: number; default_bundle_size?: number } = { stock: curStock + toAdd }
    const up = Number(item.unit_price_eur ?? 0)
    if (Number.isFinite(up) && up >= 0) updates.cost_price = up
    const bs = Number(item.bundle_size ?? 0)
    if (item.is_bundle && bs > 0) updates.default_bundle_size = bs
    const { error: upProdErr } = await admin
      .from('products')
      .update(updates)
      .eq('id', item.product_id)

    if (upProdErr) return NextResponse.json({ error: upProdErr.message }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    message: 'Bestand aus Einkauf gebucht.',
  })
}
