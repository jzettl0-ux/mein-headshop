/**
 * Blueprint Teil 4.11: Price Lock – Abruf per Token (Checkout-Link)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ token: string }> | { token: string } }
) {
  const token = decodeURIComponent((await Promise.resolve(context.params).then((p) => p ?? {})).token ?? '')
  if (!token) return NextResponse.json({ error: 'Token fehlt' }, { status: 400 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('gamification')
    .from('price_locks')
    .select('lock_id, product_id, locked_price, expires_at, is_redeemed')
    .eq('token', token)
    .maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) return NextResponse.json({ error: 'Price Lock nicht gefunden' }, { status: 404 })
  const d = data as { expires_at: string; is_redeemed: boolean }
  if (new Date(d.expires_at) < new Date()) return NextResponse.json({ error: 'Price Lock abgelaufen' }, { status: 410 })
  if (d.is_redeemed) return NextResponse.json({ error: 'Price Lock bereits eingelöst' }, { status: 410 })
  return NextResponse.json({ product_id: data.product_id, locked_price: data.locked_price })
}
