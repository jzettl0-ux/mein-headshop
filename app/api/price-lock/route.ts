/**
 * Blueprint Teil 4.11: Price Lock – Preis für 24h einfrieren
 */
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { randomBytes } from 'crypto'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  const body = await req.json().catch(() => ({}))
  const productId = typeof body.product_id === 'string' ? body.product_id.trim() : ''
  const lockedPrice = typeof body.locked_price === 'number' ? body.locked_price : parseFloat(body.locked_price)
  if (!productId || isNaN(lockedPrice) || lockedPrice < 0)
    return NextResponse.json({ error: 'product_id und gültiger locked_price erforderlich' }, { status: 400 })
  const email = typeof body.email === 'string' ? body.email.trim() : (user?.email ?? null)
  if (!user?.id && !email) return NextResponse.json({ error: 'Anmeldung oder E-Mail erforderlich' }, { status: 400 })
  const token = randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('gamification')
    .from('price_locks')
    .insert({
      customer_id: user?.id ?? null,
      guest_email: !user?.id ? email : null,
      product_id: productId,
      locked_price: lockedPrice,
      expires_at: expiresAt,
      token,
    })
    .select('lock_id, token, expires_at')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const checkoutUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/checkout?price_lock=${(data as { token: string }).token}`
  return NextResponse.json({ success: true, lock_id: (data as { lock_id: string }).lock_id, checkout_url: checkoutUrl, expires_at: (data as { expires_at: string }).expires_at })
}
