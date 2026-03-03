import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Offene Einkäufe (Wareneinkauf) mit Positionen, die noch nicht vollständig gebucht sind.
 * Nur Positionen mit product_id, wo quantity_received < quantity.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()

  const { data: purchases, error } = await admin
    .from('purchases')
    .select(`
      id,
      supplier_id,
      invoice_number,
      invoice_date,
      total_eur,
      notes,
      suppliers(id, name)
    `)
    .eq('type', 'wareneinkauf')
    .order('invoice_date', { ascending: false })
    .limit(50)

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ purchases: [] })
    console.error('Open purchases fetch error', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const ids = (purchases ?? []).map((p: { id: string }) => p.id)
  if (ids.length === 0) return NextResponse.json({ purchases: [] })

  const { data: items, error: itemsErr } = await admin
    .from('purchase_items')
    .select('id, purchase_id, product_id, description, quantity, quantity_received, unit_price_eur, products(id, name, slug)')
    .in('purchase_id', ids)
    .not('product_id', 'is', null)

  if (itemsErr) {
    if (itemsErr.code === '42P01') return NextResponse.json({ purchases: [] })
    console.error('Purchase items fetch error', itemsErr)
    return NextResponse.json({ error: itemsErr.message }, { status: 500 })
  }

  const qtyReceivedCol = 'quantity_received'
  const openItems = (items ?? []).filter(
    (i: { quantity: number; [k: string]: unknown }) =>
      Number(i.quantity ?? 0) > Number(i[qtyReceivedCol] ?? 0)
  )

  const byPurchase: Record<string, { purchase: Record<string, unknown>; items: unknown[] }> = {}
  for (const p of purchases ?? []) {
    const supplier = p.suppliers as { name?: string } | null | undefined
    byPurchase[p.id] = {
      purchase: { ...p, supplier_name: supplier?.name ?? null },
      items: [],
    }
  }
  for (const i of openItems) {
    const pid = i.purchase_id
    if (byPurchase[pid]) {
      const prod = i.products as { name?: string } | null | undefined
      byPurchase[pid].items.push({
        ...i,
        product_name: prod?.name ?? i.description,
        quantity_pending: Math.max(0, Number(i.quantity ?? 0) - Number(i[qtyReceivedCol] ?? 0)),
      })
    }
  }

  const result = Object.values(byPurchase).filter((o) => o.items.length > 0)
  return NextResponse.json({ purchases: result })
}
