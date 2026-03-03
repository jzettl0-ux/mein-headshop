/**
 * Blueprint Teil 4.14: Drop-Radar – Benachrichtigung bei Restock
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
  const channel = ['WHATSAPP', 'SMS', 'EMAIL'].includes(body.notification_channel) ? body.notification_channel : 'EMAIL'
  const phone = typeof body.phone_number === 'string' ? body.phone_number.trim().slice(0, 50) : null
  const email = typeof body.email === 'string' ? body.email.trim() : (user?.email ?? null)
  if (!productId) return NextResponse.json({ error: 'product_id erforderlich' }, { status: 400 })
  if (!email && !phone) return NextResponse.json({ error: 'E-Mail oder Telefonnummer erforderlich' }, { status: 400 })
  const token = randomBytes(32).toString('hex')
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('gamification')
    .from('drop_radar_subscriptions')
    .insert({
      customer_id: user?.id ?? null,
      product_id: productId,
      notification_channel: channel,
      phone_number: phone,
      email,
      early_access_token: token,
    })
    .select('subscription_id')
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, subscription_id: data.subscription_id })
}
