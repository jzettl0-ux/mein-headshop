import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/account/orders/[id]/invoice
 * Liefert eine signierte URL zur PDF-Rechnung, wenn die Bestellung dem eingeloggten User gehört.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
    }

    const { data: order, error } = await supabase
      .from('orders')
      .select('id, user_id, invoice_url')
      .eq('id', params.id)
      .single()

    if (error || !order) {
      return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
    }

    if (order.user_id !== user.id) {
      return NextResponse.json({ error: 'Kein Zugriff auf diese Bestellung' }, { status: 403 })
    }

    if (!order.invoice_url) {
      return NextResponse.json(
        { error: 'Für diese Bestellung ist noch keine Rechnung verfügbar.' },
        { status: 404 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json(
        { error: 'Rechnungsabruf derzeit nicht verfügbar.' },
        { status: 503 }
      )
    }

    const admin = createSupabaseAdmin()
    const { data: signed, error: signError } = await admin.storage
      .from('invoices')
      .createSignedUrl(order.invoice_url, 60)

    if (signError || !signed?.signedUrl) {
      console.error('Invoice signed URL error', signError)
      return NextResponse.json(
        { error: 'Rechnung konnte nicht geladen werden.' },
        { status: 500 }
      )
    }

    return NextResponse.redirect(signed.signedUrl)
  } catch (e: any) {
    console.error('Invoice route error', e)
    return NextResponse.json(
      { error: e?.message || 'Fehler' },
      { status: 500 }
    )
  }
}
