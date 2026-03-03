import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { randomBytes, createHash } from 'crypto'

/** 6-stelliger Code, 24h gültig */
const OTP_EXPIRY_HOURS = 24

/**
 * POST /api/account/orders/[id]/request-delivery-otp
 * Erzeugt einen OTP-Code für die Zustellung (wenn requires_otp_on_delivery).
 * Gibt den Code nur einmal zurück (für Kunden-Anzeige/E-Mail); danach nur Verifizierung möglich.
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 400 })

  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })

  const { data: order } = await supabase
    .from('orders')
    .select('id, user_id')
    .eq('id', id)
    .single()
  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })
  }

  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Nicht verfügbar' }, { status: 503 })

  const code = randomBytes(3).readUIntBE(0, 3) % 1000000
  const codeStr = String(code).padStart(6, '0')
  const codeHash = createHash('sha256').update(codeStr).digest('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + OTP_EXPIRY_HOURS)

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .schema('fulfillment')
    .from('delivery_otp')
    .upsert(
      { order_id: id, code_hash: codeHash, expires_at: expiresAt.toISOString() },
      { onConflict: 'order_id' }
    )

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    ok: true,
    code: codeStr,
    expires_at: expiresAt.toISOString(),
    message: 'Code 24 Stunden gültig. Gib ihn dem Zusteller bei der Übergabe.',
  })
}
