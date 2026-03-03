import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendShippingNotificationEmail } from '@/lib/send-order-email'

export const dynamic = 'force-dynamic'

/**
 * POST – Admin: Eine E-Mail mit allen Sendungsnummern dieser Bestellung an den Kunden senden.
 * Kein Versand beim Hinzufügen einzelner Sendungen – nur auf Abruf mit allen Nummern.
 */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { isOwner } = await getAdminContext()
    if (!isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = await createServerSupabase()
    const resolvedParams = await Promise.resolve(context.params)
    const orderId = (resolvedParams?.id && typeof resolvedParams.id === 'string' ? resolvedParams.id.trim() : '') || ''
    if (!orderId) {
      return NextResponse.json({ error: 'Bestell-ID fehlt' }, { status: 400 })
    }

    const client = hasSupabaseAdmin() ? createSupabaseAdmin() : await createServerSupabase()

    const { data: order, error: orderError } = await client
      .from('orders')
      .select('id, order_number, customer_name, customer_email')
      .eq('id', orderId)
      .maybeSingle()

    if (orderError || !order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    const { data: shipments } = await client
      .from('order_shipments')
      .select('tracking_number, tracking_carrier')
      .eq('order_id', orderId)
      .order('created_at', { ascending: true })

    if (!shipments?.length) {
      return NextResponse.json(
        { error: 'Keine Sendungsnummern für diese Bestellung vorhanden. Zuerst Sendungen hinzufügen.' },
        { status: 400 }
      )
    }

    if (!order.customer_email) {
      return NextResponse.json({ error: 'Keine Kunden-E-Mail hinterlegt' }, { status: 400 })
    }

    const result = await sendShippingNotificationEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      shipments: shipments.map((s) => ({
        trackingNumber: s.tracking_number,
        trackingCarrier: s.tracking_carrier || undefined,
      })),
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'E-Mail-Versand fehlgeschlagen' }, { status: 500 })
    }

    return NextResponse.json({ ok: true, sent: true })
  } catch (e: any) {
    console.error('Send shipping email error', e)
    return NextResponse.json({ error: e?.message || 'Fehler' }, { status: 500 })
  }
}
