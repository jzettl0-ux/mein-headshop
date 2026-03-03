/**
 * GET /api/cron/refresh-replenishment-predictions?secret=CRON_SECRET
 * Replenishment-Worker (Buy It Again): Befüllt frontend_ux.replenishment_predictions
 * aus bezahlten Bestellungen – letztes Kaufdatum pro (customer_id, product_id), Zyklus z. B. 30 Tage.
 * Vercel Cron: z. B. täglich 7:00.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const DEFAULT_CYCLE_DAYS = 30

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
    .select('id, user_id, created_at')
    .eq('payment_status', 'paid')
    .not('user_id', 'is', null)

  if (!orders?.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Keine bezahlten Bestellungen mit user_id.' })
  }

  const orderIds = orders.map((o: { id: string }) => o.id)
  const orderMeta = new Map<string, { user_id: string; date: string }>(
    orders.map((o: { id: string; user_id: string; created_at: string }) => [
      o.id,
      { user_id: o.user_id, date: o.created_at.slice(0, 10) },
    ])
  )

  const { data: items } = await admin
    .from('order_items')
    .select('order_id, product_id')
    .in('order_id', orderIds)
    .not('product_id', 'is', null)

  if (!items?.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Keine Order-Items.' })
  }

  const byUserProduct = new Map<string, { lastDate: string }>()
  for (const row of items as { order_id: string; product_id: string }[]) {
    const meta = orderMeta.get(row.order_id)
    if (!meta) continue
    const key = `${meta.user_id}|${row.product_id}`
    const existing = byUserProduct.get(key)
    const date = meta.date
    if (!existing || date > existing.lastDate) {
      byUserProduct.set(key, { lastDate: date })
    }
  }

  let updated = 0
  for (const [key, val] of byUserProduct) {
    const [customer_id, product_id] = key.split('|')
    const { error } = await admin
      .schema('frontend_ux')
      .from('replenishment_predictions')
      .upsert(
        {
          customer_id,
          product_id,
          last_purchased_date: val.lastDate,
          calculated_cycle_days: DEFAULT_CYCLE_DAYS,
          is_dismissed: false,
        },
        { onConflict: 'customer_id,product_id' }
      )
    if (!error) updated++
  }

  return NextResponse.json({
    ok: true,
    updated,
    pairs: byUserProduct.size,
    message: `Replenishment: ${updated} Vorhersagen aktualisiert.`,
  })
}
