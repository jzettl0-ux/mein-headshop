import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * POST – Reservierungen dieser Session löschen (z. B. Warenkorb geleert oder Bestellung abgeschlossen).
 */
export async function POST(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const sessionId = request.cookies.get('cart_session_id')?.value
  if (!sessionId) {
    return NextResponse.json({ ok: true })
  }

  try {
    const admin = createSupabaseAdmin()
    await admin.from('stock_reservations').delete().eq('session_id', sessionId)
  } catch {
    // Tabelle evtl. noch nicht migriert
  }
  return NextResponse.json({ ok: true })
}
