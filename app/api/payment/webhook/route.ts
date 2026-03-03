import { createHmac, timingSafeEqual } from 'crypto'
import { NextRequest, NextResponse } from 'next/server'
import { getMolliePaymentStatus } from '@/lib/mollie'
import { markOrderAsPaid } from '@/lib/mark-order-paid'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

function verifyMollieSignature(rawBody: string, signature: string, secret: string): boolean {
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex')
  if (Buffer.byteLength(signature, 'utf8') !== Buffer.byteLength(expected, 'utf8')) return false
  return timingSafeEqual(Buffer.from(signature, 'utf8'), Buffer.from(expected, 'utf8'))
}

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.text()
    if (!rawBody) {
      return NextResponse.json({ error: 'Missing body' }, { status: 400 })
    }
    const secret = process.env.MOLLIE_WEBHOOK_SECRET
    const providedSignature = request.headers.get('X-Mollie-Signature')
    if (secret && providedSignature) {
      if (!verifyMollieSignature(rawBody, providedSignature.trim(), secret)) {
        return NextResponse.json({ error: 'Invalid signature' }, { status: 403 })
      }
    }
    const body = JSON.parse(rawBody) as { id?: string }
    const paymentId = body.id
    if (!paymentId) {
      return NextResponse.json({ success: true })
    }

    const paymentStatus = await getMolliePaymentStatus(paymentId)

    if (hasSupabaseAdmin()) {
      try {
        const admin = createSupabaseAdmin()
        await admin.from('mollie_webhook_log').insert({
          payment_id: paymentId,
          order_number: paymentStatus.orderNumber ?? null,
          mollie_status: paymentStatus.status,
          request_body: rawBody.slice(0, 2000),
        })
      } catch (logErr) {
        console.error('Webhook log insert error:', logErr)
      }
    }

    if (!paymentStatus.isPaid) {
      return NextResponse.json({ success: true })
    }

    // Blueprint Split Payment: Teilzahlung einer Split-Bestellung
    const splitId = (paymentStatus as { splitId?: string | null }).splitId
    const participantId = (paymentStatus as { participantId?: string | null }).participantId
    if (splitId && participantId && hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()
      const amountPaid = Number((paymentStatus as { amount?: string | number }).amount ?? 0)
      const { data: participant } = await admin
        .schema('checkout')
        .from('split_payment_participants')
        .select('amount_paid, payment_status')
        .eq('participant_id', participantId)
        .eq('split_id', splitId)
        .single()
      if (participant && (participant as { payment_status?: string }).payment_status !== 'SUCCESS') {
        const prevPaid = Number((participant as { amount_paid?: number }).amount_paid ?? 0)
        await admin
          .schema('checkout')
          .from('split_payment_participants')
          .update({
            amount_paid: prevPaid + amountPaid,
            payment_status: 'SUCCESS',
            paid_at: new Date().toISOString(),
          })
          .eq('participant_id', participantId)

        const { data: split } = await admin
          .schema('checkout')
          .from('split_payments')
          .select('total_order_amount, total_paid_so_far, order_id')
          .eq('split_id', splitId)
          .single()
        if (split) {
          const prevTotal = Number((split as { total_paid_so_far?: number }).total_paid_so_far ?? 0)
          const newTotal = prevTotal + amountPaid
          await admin
            .schema('checkout')
            .from('split_payments')
            .update({ total_paid_so_far: newTotal })
            .eq('split_id', splitId)

          const totalOrder = Number((split as { total_order_amount?: number }).total_order_amount ?? 0)
          if (newTotal >= totalOrder) {
            await admin.schema('checkout').from('split_payments').update({ status: 'FULLY_PAID' }).eq('split_id', splitId)
            const { data: orderRow } = await admin.from('orders').select('order_number').eq('id', (split as { order_id?: string }).order_id).single()
            if (orderRow?.order_number) {
              await markOrderAsPaid(orderRow.order_number)
            }
          }
        }
      }
      return NextResponse.json({ success: true })
    }

    if (!paymentStatus.orderNumber) return NextResponse.json({ success: true })

    // markOrderAsPaid: Berechnung Gebühren + Netto-Gewinn aus finance_settings (mollie_fixed, mollie_percent, tax_rate); Speicherung in orders.
    await markOrderAsPaid(paymentStatus.orderNumber)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
