import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const VALID_REASONS = ['ITEM_NOT_RECEIVED', 'MATERIALLY_DIFFERENT', 'REFUND_NOT_ISSUED', 'OTHER'] as const

/**
 * POST /api/account/orders/[id]/a-to-z-claim
 * Kunde stellt A-bis-z-Garantie-Anspruch.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: orderId } = await params
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const { claim_reason, claim_amount, description, order_item_id } = body

  if (!claim_reason || !VALID_REASONS.includes(claim_reason)) {
    return NextResponse.json({ error: 'Ungültiger Grund' }, { status: 400 })
  }

  const amount = Math.max(0, Number(claim_amount) ?? 0)
  if (amount <= 0) {
    return NextResponse.json({ error: 'Betrag muss größer 0 sein' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, total, status')
    .eq('id', orderId)
    .single()

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
  }

  const { data: existing } = await admin
    .schema('cx')
    .from('a_to_z_claims')
    .select('claim_id')
    .eq('order_id', orderId)
    .in('status', ['UNDER_REVIEW', 'WAITING_ON_SELLER'])
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Für diese Bestellung existiert bereits ein offener Anspruch' }, { status: 409 })
  }

  const { data: claim, error } = await admin
    .schema('cx')
    .from('a_to_z_claims')
    .insert({
      order_id: orderId,
      order_item_id: order_item_id || null,
      customer_id: user.id,
      claim_reason,
      claim_amount: Math.min(amount, Number(order.total) ?? amount),
      description: typeof description === 'string' ? description.trim().slice(0, 2000) : null,
      status: 'UNDER_REVIEW',
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(claim)
}
