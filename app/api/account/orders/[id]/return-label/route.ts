import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET – DHL Retouren-QR-Code und RET-Nummer für den Kunden.
 * Nur wenn Rücksendeanfrage angenommen und Label erstellt.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const orderId = (await Promise.resolve(context.params))?.id
  if (!orderId) return NextResponse.json({ error: 'Order-ID fehlt' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const admin = createSupabaseAdmin()
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { data: order } = await admin
    .from('orders')
    .select('id, user_id, return_request_status')
    .eq('id', orderId)
    .single()

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
  }

  if (order.return_request_status !== 'approved') {
    return NextResponse.json(
      { error: 'Retourenlabel ist erst verfügbar, nachdem die Rücksendung freigegeben wurde.' },
      { status: 400 }
    )
  }

  const { data: ret } = await admin
    .schema('fulfillment')
    .from('returns')
    .select('ret_number, qr_label_base64')
    .eq('order_id', orderId)
    .single()

  if (!ret) {
    return NextResponse.json(
      { error: 'Noch kein Retourenlabel vorhanden. Bitte später erneut versuchen.' },
      { status: 404 }
    )
  }

  return NextResponse.json({
    ret_number: ret.ret_number,
    qr_label_base64: ret.qr_label_base64,
  })
}
