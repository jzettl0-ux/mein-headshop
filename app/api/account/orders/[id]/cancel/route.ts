import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const CANCELLABLE_STATUSES = ['pending', 'processing']

/**
 * POST /api/account/orders/[id]/cancel
 * Kunde kann eigene Bestellung stornieren, wenn sie noch nicht versandt ist.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('id, user_id, status')
      .eq('id', params.id)
      .single()

    if (fetchError || !order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Kein Zugriff auf diese Bestellung' }, { status: 403 })
    }

    if (!CANCELLABLE_STATUSES.includes(order.status)) {
      return NextResponse.json(
        { error: 'Diese Bestellung kann nicht mehr storniert werden (bereits versandt oder bereits storniert).' },
        { status: 400 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json(
        { error: 'Stornierung derzeit nicht möglich.' },
        { status: 503 }
      )
    }

    const admin = createSupabaseAdmin()
    const { data: orderDetails } = await admin.from('orders').select('id, payment_status, status').eq('id', params.id).single()
    const wasPaid = (orderDetails as { payment_status?: string } | null)?.payment_status === 'paid'
    const notShipped = !['shipped', 'delivered'].includes((orderDetails as { status?: string } | null)?.status ?? '')

    const { error: updateError } = await admin
      .from('orders')
      .update({ status: 'cancelled' })
      .eq('id', params.id)

    if (updateError) {
      console.error('Order cancel error', updateError)
      return NextResponse.json(
        { error: 'Stornierung fehlgeschlagen.' },
        { status: 500 }
      )
    }

    if (orderDetails && wasPaid && notShipped) {
      const { error: rpcErr } = await admin.rpc('increment_stock_for_order', { p_order_id: params.id })
      if (rpcErr) console.warn('Restore stock on cancel:', rpcErr.message)
    }

    return NextResponse.json({ success: true, status: 'cancelled' })
  } catch (e: any) {
    console.error('Cancel route error', e)
    return NextResponse.json(
      { error: e?.message || 'Fehler' },
      { status: 500 }
    )
  }
}
