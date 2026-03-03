import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { RETURN_SHIPPING_CARRIERS } from '@/lib/return-shipping-carriers'

export const dynamic = 'force-dynamic'

const SETTINGS_KEY = 'return_carrier_prices'

/**
 * GET – Admin: Aktuelle Rücksende-Preise (Cent pro Träger) zum Bearbeiten.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', SETTINGS_KEY).maybeSingle()
  let prices: Record<string, number> = {}
  if (data?.value != null) {
    if (typeof data.value === 'object' && !Array.isArray(data.value)) prices = data.value as Record<string, number>
    else if (typeof data.value === 'string') {
      try {
        prices = JSON.parse(data.value) as Record<string, number>
      } catch {
        // ignore
      }
    }
  }
  const carriers = RETURN_SHIPPING_CARRIERS.map((c) => ({
    value: c.value,
    label: c.label,
    price_cents: typeof prices[c.value] === 'number' && prices[c.value] >= 0 ? Math.round(prices[c.value]) : 0,
  }))
  return NextResponse.json({ carriers })
}

/**
 * PATCH – Admin: Rücksende-Preise speichern. Body: { carriers: [ { value, price_cents } ] } oder { dhl: 499, dpd: 399, ... }.
 */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const prices: Record<string, number> = {}

  if (Array.isArray(body.carriers)) {
    for (const c of body.carriers) {
      if (c && typeof c.value === 'string' && typeof c.price_cents === 'number' && c.price_cents >= 0) {
        prices[c.value] = Math.round(c.price_cents)
      }
    }
  } else if (body && typeof body === 'object') {
    for (const key of RETURN_SHIPPING_CARRIERS.map((x) => x.value)) {
      if (typeof body[key] === 'number' && body[key] >= 0) prices[key] = Math.round(body[key])
    }
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('site_settings').upsert({ key: SETTINGS_KEY, value: JSON.stringify(prices) }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true, carriers: RETURN_SHIPPING_CARRIERS.map((c) => ({ value: c.value, label: c.label, price_cents: prices[c.value] ?? 0 })) })
}
