import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { createHash } from 'crypto'

/**
 * POST /api/carrier/verify-delivery-otp
 * Zusteller/Partner prüft OTP (order_id + code).
 * Header: x-carrier-api-key = CARRIER_OTP_API_KEY (optional, für Zugriffsschutz)
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get('x-carrier-api-key') ?? ''
  const expected = process.env.CARRIER_OTP_API_KEY?.trim()
  if (expected && apiKey !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Nicht verfügbar' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const order_id = body.order_id ?? body.orderId
  const code = body.code?.toString().trim().replace(/\D/g, '').slice(0, 6)
  if (!order_id || !code || code.length < 6) {
    return NextResponse.json({ error: 'order_id und code (6 Ziffern) erforderlich' }, { status: 400 })
  }

  const codeHash = createHash('sha256').update(code).digest('hex')
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('fulfillment')
    .from('delivery_otp')
    .select('order_id, expires_at')
    .eq('order_id', order_id)
    .eq('code_hash', codeHash)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) {
    return NextResponse.json({ valid: false, error: 'Ungültiger Code' }, { status: 200 })
  }
  const expiresAt = new Date((data as { expires_at: string }).expires_at)
  if (expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: 'Code abgelaufen' }, { status: 200 })
  }
  return NextResponse.json({ valid: true, order_id })
}
