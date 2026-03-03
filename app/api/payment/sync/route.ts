import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { getMolliePaymentStatus, findPaymentIdByOrderNumber } from '@/lib/mollie'
import { markOrderAsPaid } from '@/lib/mark-order-paid'

export const dynamic = 'force-dynamic'

/**
 * GET /api/payment/sync?order=ORD-xxx
 * Wird von der Success-Page nach Rückkehr von Mollie aufgerufen.
 * Prüft den Zahlungsstatus bei Mollie und setzt die Bestellung bei "bezahlt" auf paid + erzeugt Rechnung.
 * Funktioniert auch ohne Webhook (z. B. localhost oder wenn der Webhook nicht erreichbar war).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderNumber = searchParams.get('order')
    if (!orderNumber) {
      return NextResponse.json({ success: false, error: 'order fehlt' }, { status: 400 })
    }

    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ success: false, error: 'Nicht angemeldet' }, { status: 401 })
    }

    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('id, order_number, user_id, payment_status, mollie_payment_id')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ success: false, error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ success: false, error: 'Kein Zugriff' }, { status: 403 })
    }

    if (order.payment_status === 'paid') {
      return NextResponse.json({ success: true, paid: true, alreadySynced: true })
    }

    let paymentId = order.mollie_payment_id
    if (!paymentId) {
      paymentId = await findPaymentIdByOrderNumber(orderNumber)
    }
    if (!paymentId) {
      return NextResponse.json(
        { success: false, paid: false, error: 'Zahlung bei Mollie nicht gefunden' },
        { status: 404 }
      )
    }

    let paymentStatus = await getMolliePaymentStatus(paymentId)
    // Nach Rückkehr von PayPal kann Mollie kurz noch "open"/"pending" melden – einmal kurz warten und erneut prüfen
    if (!paymentStatus.isPaid && (paymentStatus.status === 'open' || paymentStatus.status === 'pending')) {
      await new Promise((r) => setTimeout(r, 2500))
      paymentStatus = await getMolliePaymentStatus(paymentId)
    }
    if (!paymentStatus.isPaid) {
      return NextResponse.json({ success: true, paid: false, status: paymentStatus.status })
    }

    const result = await markOrderAsPaid(orderNumber)
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, paid: true })
  } catch (e: any) {
    console.error('Payment sync error', e)
    return NextResponse.json(
      { success: false, error: e?.message || 'Sync fehlgeschlagen' },
      { status: 500 }
    )
  }
}
