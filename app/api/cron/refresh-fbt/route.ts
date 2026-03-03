/**
 * GET /api/cron/refresh-fbt?secret=CRON_SECRET
 * Aggregiert Frequently Bought Together aus order_items (bezahlte Bestellungen).
 * Vercel Cron: z. B. täglich um 3:00.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()

  const { data: orders } = await admin
    .from('orders')
    .select('id')
    .eq('payment_status', 'paid')

  if (!orders?.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Keine bezahlten Bestellungen.' })
  }

  const orderIds = orders.map((o: { id: string }) => o.id)
  const { data: items } = await admin
    .from('order_items')
    .select('order_id, product_id')
    .in('order_id', orderIds)
    .not('product_id', 'is', null)

  if (!items?.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Keine Produkte in Bestellungen.' })
  }

  const byOrder = new Map<string, string[]>()
  for (const row of items as { order_id: string; product_id: string }[]) {
    if (!row.product_id) continue
    const arr = byOrder.get(row.order_id) ?? []
    if (!arr.includes(row.product_id)) arr.push(row.product_id)
    byOrder.set(row.order_id, arr)
  }

  const pairCount = new Map<string, number>()
  for (const prods of byOrder.values()) {
    if (prods.length < 2) continue
    for (let i = 0; i < prods.length; i++) {
      for (let j = i + 1; j < prods.length; j++) {
        const a = prods[i]
        const b = prods[j]
        const key = a < b ? `${a}|${b}` : `${b}|${a}`
        pairCount.set(key, (pairCount.get(key) ?? 0) + 1)
      }
    }
  }

  let updated = 0
  for (const [key, count] of pairCount) {
    const [anchorId, associatedId] = key.split('|')
    const { data: existing } = await admin
      .schema('infrastructure')
      .from('frequently_bought_together')
      .select('association_id, is_virtual_bundle, co_occurrence_count')
      .eq('anchor_product_id', anchorId)
      .eq('associated_product_id', associatedId)
      .maybeSingle()

    if (existing && (existing as { is_virtual_bundle: boolean }).is_virtual_bundle) continue

    const { error } = existing
      ? await admin
          .schema('infrastructure')
          .from('frequently_bought_together')
          .update({ co_occurrence_count: count, last_calculated_at: new Date().toISOString() })
          .eq('anchor_product_id', anchorId)
          .eq('associated_product_id', associatedId)
      : await admin
          .schema('infrastructure')
          .from('frequently_bought_together')
          .insert({
            anchor_product_id: anchorId,
            associated_product_id: associatedId,
            co_occurrence_count: count,
            is_virtual_bundle: false,
            last_calculated_at: new Date().toISOString(),
          })
    if (!error) updated++
  }

  return NextResponse.json({
    ok: true,
    updated,
    pairs: pairCount.size,
    message: `FBT: ${updated} Verbindungen aktualisiert.`,
  })
}
