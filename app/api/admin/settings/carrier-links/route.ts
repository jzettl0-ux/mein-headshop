import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getDefaultCarrierLinks, type CarrierLinksConfig } from '@/lib/shipping-settings'

const KEY = 'carrier_portal_links'

export const dynamic = 'force-dynamic'

/** GET – Carrier-Links laden */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  const raw = data?.value
  let links: CarrierLinksConfig = getDefaultCarrierLinks()
  if (raw && typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as CarrierLinksConfig
      if (typeof parsed === 'object' && parsed !== null) {
        const defaults = getDefaultCarrierLinks()
        links = {}
        for (const k of Object.keys(defaults)) {
          links[k] = { ...defaults[k], ...parsed[k] }
        }
      }
    } catch {
      /* use defaults */
    }
  }
  return NextResponse.json({ carrier_links: links })
}

/** PATCH – Carrier-Links speichern */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  const incoming = body.carrier_links ?? body
  if (typeof incoming !== 'object' || incoming === null) {
    return NextResponse.json({ error: 'carrier_links muss ein Objekt sein' }, { status: 400 })
  }
  const defaults = getDefaultCarrierLinks()
  const merged: CarrierLinksConfig = {}
  for (const key of Object.keys(defaults)) {
    const def = defaults[key]
    const inc = incoming[key]
    merged[key] = {
      portal: typeof inc?.portal === 'string' ? inc.portal.trim() : def?.portal ?? '',
      returns: typeof inc?.returns === 'string' ? inc.returns.trim() : def?.returns ?? '',
      tracking: typeof inc?.tracking === 'string' ? inc.tracking.trim() : def?.tracking ?? '',
      qr_return_url: typeof inc?.qr_return_url === 'string' ? inc.qr_return_url.trim() : def?.qr_return_url ?? '',
      return_print_url: typeof inc?.return_print_url === 'string' ? inc.return_print_url.trim() : def?.return_print_url ?? '',
      return_prefill_url: typeof inc?.return_prefill_url === 'string' ? inc.return_prefill_url.trim() : def?.return_prefill_url ?? '',
      api_base_url: typeof inc?.api_base_url === 'string' ? inc.api_base_url.trim() : def?.api_base_url ?? '',
    }
  }
  const value = JSON.stringify(merged)
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('site_settings').upsert({ key: KEY, value }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
