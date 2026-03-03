/**
 * POST /api/split/[token]/pay
 * Blueprint Split Payment: Mollie-Zahlung für einen Teilnehmer erstellen.
 * Körper: { participant_id: string } – nur der jeweilige Teilnehmer oder Initiator.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { createMolliePayment } from '@/lib/mollie'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token?.trim()) return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  if (!process.env.MOLLIE_API_KEY?.trim()) {
    return NextResponse.json({ error: 'Zahlungsanbieter nicht konfiguriert' }, { status: 500 })
  }

  const body = await request.json().catch(() => ({}))
  const participantId = typeof body.participant_id === 'string' ? body.participant_id.trim() : ''
  const guestEmail = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (!participantId) return NextResponse.json({ error: 'participant_id erforderlich' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()

  const admin = createSupabaseAdmin()
  const { data: split } = await admin
    .schema('checkout')
    .from('split_payments')
    .select('split_id, order_id, share_token, total_order_amount, total_paid_so_far, status, expires_at')
    .eq('share_token', token.trim())
    .single()

  if (!split) return NextResponse.json({ error: 'Split nicht gefunden' }, { status: 404 })
  const s = split as { split_id: string; order_id: string; status: string; expires_at: string }
  if (s.status !== 'AWAITING_FUNDS') return NextResponse.json({ error: 'Split nicht mehr aktiv' }, { status: 400 })
  if (new Date() > new Date(s.expires_at)) return NextResponse.json({ error: 'Link abgelaufen' }, { status: 400 })

  const { data: participant } = await admin
    .schema('checkout')
    .from('split_payment_participants')
    .select('participant_id, customer_id, guest_email, amount_assigned, amount_paid, payment_status')
    .eq('split_id', s.split_id)
    .eq('participant_id', participantId)
    .single()

  if (!participant) return NextResponse.json({ error: 'Teilnehmer nicht gefunden' }, { status: 404 })
  const p = participant as { customer_id: string | null; guest_email: string | null; amount_assigned: number; amount_paid: number; payment_status: string }

  if (p.payment_status === 'SUCCESS') return NextResponse.json({ error: 'Bereits bezahlt' }, { status: 400 })

  const amountRemaining = Math.max(0.01, Number(p.amount_assigned) - Number(p.amount_paid))
  if (amountRemaining < 0.01) return NextResponse.json({ error: 'Nichts zu zahlen' }, { status: 400 })

  const isLoggedInParticipant = user && p.customer_id === user.id
  const isGuestParticipant = !p.customer_id && p.guest_email && guestEmail && p.guest_email.toLowerCase() === guestEmail
  if (!isLoggedInParticipant && !isGuestParticipant) {
    return NextResponse.json({ error: 'Nur der jeweilige Teilnehmer kann seinen Anteil zahlen. Bitte E-Mail eingeben, falls du per Link eingeladen wurdest.' }, { status: 403 })
  }

  const { data: orderRow } = await admin.from('orders').select('order_number').eq('id', s.order_id).single()
  const orderNumber = (orderRow as { order_number?: string })?.order_number ?? ''

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const webhookUrl = process.env.MOLLIE_WEBHOOK_URL || `${baseUrl}/api/payment/webhook`

  const payment = await createMolliePayment({
    orderNumber,
    amount: amountRemaining,
    description: `Split-Anteil Bestellung #${orderNumber}`,
    redirectUrl: `${baseUrl}/split/${token}?paid=1`,
    webhookUrl,
    splitId: s.split_id,
    participantId: participantId,
  })

  return NextResponse.json({
    success: true,
    checkout_url: payment.checkoutUrl,
    payment_id: payment.paymentId,
  })
}
