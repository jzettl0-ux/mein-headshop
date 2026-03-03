/**
 * POST /api/split/[token]/participants
 * Blueprint Split Payment: Teilnehmer hinzufügen (nur Initiator).
 * Körper: { email: string, amount_eur: number }
 * Reduziert den Initiator-Anteil und fügt einen neuen Teilnehmer hinzu.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token?.trim()) return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const amountEur = typeof body.amount_eur === 'number' ? body.amount_eur : Number(body.amount_eur)
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Gültige E-Mail erforderlich' }, { status: 400 })
  }
  if (!Number.isFinite(amountEur) || amountEur <= 0) {
    return NextResponse.json({ error: 'Betrag muss größer 0 sein' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: split } = await admin
    .schema('checkout')
    .from('split_payments')
    .select('split_id, initiator_customer_id, total_order_amount, total_paid_so_far, status')
    .eq('share_token', token.trim())
    .single()

  if (!split || (split as { initiator_customer_id: string }).initiator_customer_id !== user.id) {
    return NextResponse.json({ error: 'Nur der Initiator kann Teilnehmer hinzufügen' }, { status: 403 })
  }
  const s = split as { split_id: string; status: string; total_order_amount: number }
  if (s.status !== 'AWAITING_FUNDS') {
    return NextResponse.json({ error: 'Diese Split-Zahlung ist nicht mehr aktiv' }, { status: 400 })
  }

  const { data: initiatorPart } = await admin
    .schema('checkout')
    .from('split_payment_participants')
    .select('participant_id, amount_assigned, amount_paid, payment_status')
    .eq('split_id', s.split_id)
    .eq('customer_id', user.id)
    .maybeSingle()

  if (!initiatorPart) {
    return NextResponse.json({ error: 'Initiator nicht gefunden' }, { status: 500 })
  }
  const ip = initiatorPart as { participant_id: string; amount_assigned: number; amount_paid: number; payment_status: string }
  const initiatorRemaining = Math.max(0, Number(ip.amount_assigned) - Number(ip.amount_paid))
  if (ip.payment_status === 'SUCCESS') {
    return NextResponse.json({ error: 'Du hast bereits gezahlt – keine weiteren Teilnehmer möglich' }, { status: 400 })
  }
  if (amountEur > initiatorRemaining) {
    return NextResponse.json({ error: `Maximal ${initiatorRemaining.toFixed(2)} € übrig` }, { status: 400 })
  }

  const newInitiatorAmount = Number(ip.amount_assigned) - amountEur
  await admin
    .schema('checkout')
    .from('split_payment_participants')
    .update({ amount_assigned: newInitiatorAmount })
    .eq('participant_id', ip.participant_id)

  const { data: newPart, error: insertErr } = await admin
    .schema('checkout')
    .from('split_payment_participants')
    .insert({
      split_id: s.split_id,
      guest_email: email,
      amount_assigned: amountEur,
      amount_paid: 0,
      payment_status: 'PENDING',
    })
    .select('participant_id, guest_email, amount_assigned')
    .single()

  if (insertErr) {
    await admin
      .schema('checkout')
      .from('split_payment_participants')
      .update({ amount_assigned: Number(ip.amount_assigned) })
      .eq('participant_id', ip.participant_id)
    return NextResponse.json({ error: insertErr.message }, { status: 500 })
  }

  return NextResponse.json({
    success: true,
    participant: {
      participant_id: (newPart as { participant_id: string }).participant_id,
      guest_email: (newPart as { guest_email: string }).guest_email,
      amount_assigned: Number((newPart as { amount_assigned: number }).amount_assigned),
    },
  })
}
