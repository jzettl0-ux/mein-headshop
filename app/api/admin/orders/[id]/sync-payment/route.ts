import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin } from '@/lib/supabase-admin'
import { getMolliePaymentStatus, findPaymentIdByOrderNumber } from '@/lib/mollie'
import { markOrderAsPaid } from '@/lib/mark-order-paid'

export const dynamic = 'force-dynamic'

/**
 * POST – Admin: Zahlungsstatus dieser Bestellung bei Mollie prüfen und ggf. als bezahlt markieren.
 * Behebt den Fall, dass Webhook/Success-Sync nicht gegriffen haben.
 */
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const orderId = params.id
    if (!orderId) {
      return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
    }

    const admin = createSupabaseAdmin()
    const { data: order, error: orderError } = await admin
      .from('orders')
      .select('id, order_number, payment_status, mollie_payment_id')
      .eq('id', orderId)
      .single()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    if ((order as { payment_status?: string }).payment_status === 'paid') {
      return NextResponse.json({ success: true, paid: true, message: 'Bereits als bezahlt erfasst' })
    }

    let paymentId = (order as { mollie_payment_id?: string | null }).mollie_payment_id ?? null
    if (!paymentId) {
      paymentId = await findPaymentIdByOrderNumber(order.order_number)
    }
    if (!paymentId) {
      return NextResponse.json({
        success: false,
        paid: false,
        error: 'Keine Mollie-Zahlung zu dieser Bestellung gefunden',
      }, { status: 404 })
    }

    const paymentStatus = await getMolliePaymentStatus(paymentId)
    if (!paymentStatus.isPaid) {
      return NextResponse.json({
        success: true,
        paid: false,
        status: paymentStatus.status,
        message: `Bei Mollie noch nicht bezahlt (Status: ${paymentStatus.status})`,
      })
    }

    const result = await markOrderAsPaid(order.order_number)
    if (!result.ok) {
      return NextResponse.json({ success: false, error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, paid: true, message: 'Zahlung übernommen, Bestellung als bezahlt markiert' })
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Sync fehlgeschlagen'
    console.error('Admin sync-payment error', e)
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
