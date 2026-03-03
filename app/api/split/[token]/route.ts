/**
 * GET /api/split/[token]
 * Blueprint Split Payment: Details zu einer Gruppen-Zahlung.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params
  if (!token?.trim()) return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: split, error: splitErr } = await admin
    .schema('checkout')
    .from('split_payments')
    .select('split_id, order_id, total_order_amount, total_paid_so_far, status, expires_at, initiator_customer_id')
    .eq('share_token', token.trim())
    .single()

  if (splitErr || !split) {
    return NextResponse.json({ error: 'Split nicht gefunden' }, { status: 404 })
  }

  const s = split as {
    split_id: string
    order_id: string
    total_order_amount: number
    total_paid_so_far: number
    status: string
    expires_at: string
    initiator_customer_id: string
  }

  if (s.status !== 'AWAITING_FUNDS' && s.status !== 'FULLY_PAID') {
    return NextResponse.json({ error: 'Diese Split-Zahlung ist nicht mehr aktiv.' }, { status: 400 })
  }
  if (new Date() > new Date(s.expires_at)) {
    return NextResponse.json({ error: 'Link abgelaufen.' }, { status: 400 })
  }

  const { data: participants } = await admin
    .schema('checkout')
    .from('split_payment_participants')
    .select('participant_id, customer_id, guest_email, amount_assigned, amount_paid, payment_status')
    .eq('split_id', s.split_id)
    .order('created_at', { ascending: true })

  const { data: orderRow } = await admin
    .from('orders')
    .select('order_number, customer_name')
    .eq('id', s.order_id)
    .single()

  return NextResponse.json({
    split_id: s.split_id,
    order_id: s.order_id,
    order_number: orderRow?.order_number ?? null,
    customer_name: orderRow?.customer_name ?? null,
    total_order_amount: Number(s.total_order_amount),
    total_paid_so_far: Number(s.total_paid_so_far),
    status: s.status,
    expires_at: s.expires_at,
    initiator_customer_id: s.initiator_customer_id,
    participants: (participants ?? []).map((p: { participant_id: string; customer_id: string | null; guest_email: string | null; amount_assigned: number; amount_paid: number; payment_status: string }) => ({
      participant_id: p.participant_id,
      customer_id: p.customer_id,
      guest_email: p.guest_email,
      amount_assigned: Number(p.amount_assigned),
      amount_paid: Number(p.amount_paid),
      payment_status: p.payment_status,
      amount_remaining: Math.max(0, Number(p.amount_assigned) - Number(p.amount_paid)),
    })),
  })
}
