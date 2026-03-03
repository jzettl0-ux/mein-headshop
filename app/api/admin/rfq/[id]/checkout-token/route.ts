import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { randomBytes } from 'crypto'

/**
 * POST /api/admin/rfq/[id]/checkout-token
 * Erzeugt einen Checkout-Token für diese Angebotsanfrage (48h gültig).
 * Gibt checkout_url und token zurück.
 */
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const quote_id = (await params).id
  const admin = createSupabaseAdmin()

  const { data: quote, error: qErr } = await admin
    .schema('b2b_negotiation')
    .from('quote_requests')
    .select('quote_id, product_id, requested_quantity, requested_target_price_total, status')
    .eq('quote_id', quote_id)
    .single()

  if (qErr || !quote) return NextResponse.json({ error: 'Angebotsanfrage nicht gefunden' }, { status: 404 })
  if (!['OPEN', 'COUNTER_OFFERED', 'ACCEPTED'].includes((quote as { status: string }).status)) {
    return NextResponse.json({ error: 'Für diese Anfrage kann kein Checkout-Token mehr erstellt werden' }, { status: 400 })
  }

  const token = randomBytes(24).toString('hex')
  const expiresAt = new Date()
  expiresAt.setHours(expiresAt.getHours() + 48)

  const { data: existing } = await admin
    .schema('b2b_negotiation')
    .from('quote_responses')
    .select('response_id, checkout_token')
    .eq('quote_id', quote_id)
    .order('response_timestamp', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing && (existing as { checkout_token: string | null }).checkout_token) {
    const { error: updErr } = await admin
      .schema('b2b_negotiation')
      .from('quote_responses')
      .update({
        checkout_token: token,
        checkout_token_expires_at: expiresAt.toISOString(),
        counter_price_total: (quote as { requested_target_price_total: number }).requested_target_price_total,
      })
      .eq('quote_id', quote_id)
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 })
  } else {
    const { error: insErr } = await admin
      .schema('b2b_negotiation')
      .from('quote_responses')
      .insert({
        quote_id,
        responded_by_vendor: true,
        counter_price_total: (quote as { requested_target_price_total: number }).requested_target_price_total,
        checkout_token: token,
        checkout_token_expires_at: expiresAt.toISOString(),
      })
    if (insErr) return NextResponse.json({ error: insErr.message }, { status: 500 })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const checkout_url = `${baseUrl}/b2b/checkout?token=${token}`

  return NextResponse.json({
    ok: true,
    quote_id,
    token,
    checkout_url,
    expires_at: expiresAt.toISOString(),
  })
}
