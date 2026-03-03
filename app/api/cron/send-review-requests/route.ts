import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendReviewRequestEmail } from '@/lib/send-order-email'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
const DAYS_AFTER_SHIPPED = 10

/**
 * GET /api/cron/send-review-requests?secret=CRON_SECRET
 * Findet Bestellungen, die vor 10 Tagen auf "shipped" gesetzt wurden (erste Sendung),
 * und sendet die Bewertungsanfrage-E-Mail. Setzt review_request_sent_at.
 * Täglich per Vercel Cron oder externem Cron aufrufen.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 120

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
  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() - DAYS_AFTER_SHIPPED)
  const cutoffIso = cutoff.toISOString()

  const { data: orders, error: ordersErr } = await admin
    .from('orders')
    .select('id, order_number, customer_name, customer_email')
    .eq('status', 'shipped')
    .not('customer_email', 'is', null)
    .is('review_request_sent_at', null)

  if (ordersErr || !orders?.length) {
    return NextResponse.json({ sent: 0, skipped: 0, message: 'Keine Bestellungen oder Fehler' })
  }

  let sent = 0
  let skipped = 0

  for (const order of orders) {
    const { data: shipments } = await admin
      .from('order_shipments')
      .select('created_at')
      .eq('order_id', order.id)
      .order('created_at', { ascending: true })
      .limit(1)

    const firstShippedAt = shipments?.[0]?.created_at
    if (!firstShippedAt || new Date(firstShippedAt) > cutoff) {
      skipped++
      continue
    }

    const reviewUrl = `${BASE_URL}/account`
    const result = await sendReviewRequestEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name ?? 'Kunde',
      customerEmail: order.customer_email!,
      reviewUrl,
    })

    if (result.ok) {
      await admin
        .from('orders')
        .update({ review_request_sent_at: new Date().toISOString() })
        .eq('id', order.id)
      sent++
    }
  }

  return NextResponse.json({ sent, skipped, total: orders.length })
}
