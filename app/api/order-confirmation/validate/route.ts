import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/order-confirmation/validate?order=ORD-xxx
 * State-Machine-Check: Bestätigungsseite nur gültig, wenn Bestellung bezahlt ist.
 * Optional: Session user_id muss zur Bestellung passen (BOLA).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const orderNumber = searchParams.get('order')
  if (!orderNumber?.trim()) {
    return NextResponse.json({ valid: false, reason: 'missing_order' }, { status: 400 })
  }

  const supabase = await createServerSupabase()
  const { data: order, error } = await supabase
    .from('orders')
    .select('id, order_number, user_id, payment_status, status, customer_email')
    .eq('order_number', orderNumber.trim())
    .maybeSingle()

  if (error || !order) {
    return NextResponse.json({ valid: false, reason: 'not_found' })
  }

  if (order.payment_status === 'paid') {
    // ok, continue
  } else if (order.status === 'approval_pending') {
    return NextResponse.json({ valid: true, order_number: order.order_number, approval_pending: true })
  } else {
    return NextResponse.json({ valid: false, reason: 'not_paid', status: order.payment_status })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (order.user_id && user?.id && order.user_id !== user.id) {
    return NextResponse.json({ valid: false, reason: 'forbidden' })
  }

  return NextResponse.json({ valid: true, order_number: order.order_number })
}
