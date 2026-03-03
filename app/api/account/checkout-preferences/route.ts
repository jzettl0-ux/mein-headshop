/**
 * GET/PATCH /api/account/checkout-preferences
 * 1-Click Checkout: Einstellungen des Kunden (customer_profiles.checkout_preferences).
 */
import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – aktuelle 1-Click-Einstellungen */
export async function GET() {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ one_click_enabled: false })
  }
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('customer_profiles')
    .from('checkout_preferences')
    .select('customer_id, one_click_enabled, default_shipping_address_id, default_payment_method_id, updated_at')
    .eq('customer_id', user.id)
    .maybeSingle()
  if (error) return NextResponse.json({ one_click_enabled: false })
  return NextResponse.json(data ?? { one_click_enabled: false })
}

/** PATCH – 1-Click aktivieren/deaktivieren, Standard-Adresse/Zahlung */
export async function PATCH(request: Request) {
  const supabase = await createServerSupabase()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Nicht angemeldet' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Nicht verfügbar' }, { status: 503 })
  let body: { one_click_enabled?: boolean; default_shipping_address_id?: string | null; default_payment_method_id?: string | null }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger Body' }, { status: 400 })
  }
  const admin = createSupabaseAdmin()
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (typeof body.one_click_enabled === 'boolean') payload.one_click_enabled = body.one_click_enabled
  if (body.default_shipping_address_id !== undefined) payload.default_shipping_address_id = body.default_shipping_address_id
  if (body.default_payment_method_id !== undefined) payload.default_payment_method_id = body.default_payment_method_id
  const { data, error } = await admin
    .schema('customer_profiles')
    .from('checkout_preferences')
    .upsert({ customer_id: user.id, ...payload }, { onConflict: 'customer_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
