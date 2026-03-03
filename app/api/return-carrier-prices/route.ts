import { NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { RETURN_SHIPPING_CARRIERS } from '@/lib/return-shipping-carriers'

export const dynamic = 'force-dynamic'

/**
 * GET – Öffentlich: Aktuelle Rücksende-Preise pro Versanddienstleister (für Kundenauswahl vor Absenden der Anfrage).
 * Wert aus site_settings.return_carrier_prices (JSON: { "dhl": 499, "dpd": 399, ... } in Cent).
 */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data } = await supabase.from('site_settings').select('value').eq('key', 'return_carrier_prices').maybeSingle()
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
      supports_qr: c.supports_qr,
    }))
    return NextResponse.json({ carriers })
  } catch {
    return NextResponse.json({
      carriers: RETURN_SHIPPING_CARRIERS.map((c) => ({ value: c.value, label: c.label, price_cents: 0, supports_qr: c.supports_qr })),
    })
  }
}
