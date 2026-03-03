/**
 * GET /api/cron/refresh-ncx-scores?secret=CRON_SECRET
 * NCX-Worker: Aggregiert Voice-of-the-Customer aus orders, order_items, product_reviews.
 * Aktualisiert advanced_analytics.ncx_scores (total_orders, negative_returns, negative_reviews, negative_messages).
 * Vercel Cron: z. B. täglich um 5:00.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

const EVALUATION_DAYS = 30
const NEGATIVE_REVIEW_THRESHOLD = 2 // rating <= 2 = negative

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
  const since = new Date()
  since.setDate(since.getDate() - EVALUATION_DAYS)
  const sinceIso = since.toISOString()

  // Ein Vendor für Single-Shop (ncx_scores.vendor_id NOT NULL)
  const { data: vendors } = await admin.from('vendor_accounts').select('id').limit(1)
  const defaultVendorId = (vendors?.[0] as { id: string } | undefined)?.id
  if (!defaultVendorId) {
    return NextResponse.json({
      ok: true,
      updated: 0,
      message: 'Kein vendor_accounts-Eintrag – NCX übersprungen.',
    })
  }

  // Bezahlte Bestellungen im Zeitfenster
  const { data: orders } = await admin
    .from('orders')
    .select('id, status')
    .eq('payment_status', 'paid')
    .gte('created_at', sinceIso)

  if (!orders?.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Keine bezahlten Bestellungen im Zeitraum.' })
  }

  const orderIds = orders.map((o: { id: string }) => o.id)
  const orderStatus = new Map<string, string>(orders.map((o: { id: string; status: string }) => [o.id, o.status]))

  const { data: items } = await admin
    .from('order_items')
    .select('order_id, product_id')
    .in('order_id', orderIds)
    .not('product_id', 'is', null)

  if (!items?.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Keine Order-Items mit product_id.' })
  }

  // Pro Produkt: Anzahl Bestellungen, davon mit Retoure
  const productOrders = new Map<string, Set<string>>()
  const productReturnOrders = new Map<string, Set<string>>()
  const returnStatuses = ['return_requested', 'return_rejected', 'return_completed']

  for (const row of items as { order_id: string; product_id: string }[]) {
    const pid = row.product_id
    if (!productOrders.has(pid)) {
      productOrders.set(pid, new Set())
      productReturnOrders.set(pid, new Set())
    }
    productOrders.get(pid)!.add(row.order_id)
    if (returnStatuses.includes(orderStatus.get(row.order_id) ?? '')) {
      productReturnOrders.get(pid)!.add(row.order_id)
    }
  }

  // Negative Reviews (rating <= 2) pro Produkt
  const { data: reviews } = await admin
    .from('product_reviews')
    .select('product_id')
    .lte('rating', NEGATIVE_REVIEW_THRESHOLD)

  const negativeReviewsByProduct = new Map<string, number>()
  for (const r of reviews ?? []) {
    const pid = (r as { product_id: string }).product_id
    negativeReviewsByProduct.set(pid, (negativeReviewsByProduct.get(pid) ?? 0) + 1)
  }

  let updated = 0
  const productIds = [...productOrders.keys()]

  for (const productId of productIds) {
    const totalOrders = productOrders.get(productId)!.size
    const negativeReturns = productReturnOrders.get(productId)!.size
    const negativeReviews = negativeReviewsByProduct.get(productId) ?? 0
    const negativeMessages = 0 // A2Z/Support optional später

    const { data: existing } = await admin
      .schema('advanced_analytics')
      .from('ncx_scores')
      .select('ncx_id')
      .eq('product_id', productId)
      .eq('vendor_id', defaultVendorId)
      .maybeSingle()

    const payload = {
      product_id: productId,
      vendor_id: defaultVendorId,
      evaluation_period_days: EVALUATION_DAYS,
      total_orders: totalOrders,
      negative_returns: negativeReturns,
      negative_reviews: negativeReviews,
      negative_messages: negativeMessages,
      last_calculated_at: new Date().toISOString(),
    }

    const { error } = existing
      ? await admin.schema('advanced_analytics').from('ncx_scores').update(payload).eq('product_id', productId).eq('vendor_id', defaultVendorId)
      : await admin.schema('advanced_analytics').from('ncx_scores').insert(payload)

    if (!error) updated++
  }

  return NextResponse.json({
    ok: true,
    updated,
    products: productIds.length,
    message: `NCX: ${updated} Scores aktualisiert.`,
  })
}
