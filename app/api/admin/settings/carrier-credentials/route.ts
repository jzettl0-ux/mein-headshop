import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { CARRIER_IDS, type CarrierCredentialsConfig, type CarrierCredentialEntry } from '@/lib/shipping-settings'

const KEY = 'carrier_credentials'

export const dynamic = 'force-dynamic'

function mergeEntry(inc: unknown, cur: CarrierCredentialEntry): CarrierCredentialEntry {
  const i = inc && typeof inc === 'object' ? inc as Record<string, unknown> : {}
  return {
    api_key: typeof i.api_key === 'string' ? i.api_key.trim() || cur.api_key : cur.api_key,
    api_secret: typeof i.api_secret === 'string' ? i.api_secret.trim() || cur.api_secret : cur.api_secret,
    username: typeof i.username === 'string' ? i.username.trim() : cur.username,
    password: typeof i.password === 'string' ? i.password.trim() || cur.password : cur.password,
    customer_number: typeof i.customer_number === 'string' ? i.customer_number.trim() : cur.customer_number,
    sandbox: typeof i.sandbox === 'boolean' ? i.sandbox : cur.sandbox ?? false,
  }
}

/** DHL-spezifisch: gkp_*, billing_number für Abwärtskompatibilität */
function mergeDhl(inc: unknown, cur: CarrierCredentialEntry & { gkp_username?: string; gkp_password?: string; billing_number?: string }) {
  const e = mergeEntry(inc, cur)
  const i = inc && typeof inc === 'object' ? inc as Record<string, unknown> : {}
  return {
    ...e,
    gkp_username: typeof i.gkp_username === 'string' ? i.gkp_username.trim() : (i.username && typeof i.username === 'string' ? i.username.trim() : cur.gkp_username ?? cur.username),
    gkp_password: typeof i.gkp_password === 'string' ? i.gkp_password.trim() || cur.gkp_password : (i.password && typeof i.password === 'string' ? i.password.trim() : cur.gkp_password ?? cur.password),
    billing_number: typeof i.billing_number === 'string' ? i.billing_number.trim() : (i.customer_number && typeof i.customer_number === 'string' ? i.customer_number.trim() : cur.billing_number ?? cur.customer_number),
  }
}

/** GET – Carrier-Credentials laden */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  const raw = data?.value
  let creds: CarrierCredentialsConfig = {}
  if (raw && typeof raw === 'string') {
    try {
      creds = JSON.parse(raw) as CarrierCredentialsConfig
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({ carrier_credentials: creds })
}

/** PATCH – Carrier-Credentials speichern */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  const incoming = body.carrier_credentials ?? body
  if (typeof incoming !== 'object' || incoming === null) {
    return NextResponse.json({ error: 'carrier_credentials muss ein Objekt sein' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: existing } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  let current: CarrierCredentialsConfig = {}
  if (existing?.value) {
    try {
      current = JSON.parse(existing.value) as CarrierCredentialsConfig
    } catch {
      /* ignore */
    }
  }

  const merged: CarrierCredentialsConfig = { ...current }
  for (const c of CARRIER_IDS) {
    const inc = incoming[c]
    if (inc && typeof inc === 'object') {
      const cur = (current[c] ?? {}) as CarrierCredentialEntry
      if (c === 'dhl') {
        merged.dhl = mergeDhl(inc, cur as any) as any
      } else {
        merged[c] = mergeEntry(inc, cur)
      }
    }
  }

  const value = JSON.stringify(merged)
  const { error } = await admin.from('site_settings').upsert({ key: KEY, value }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
