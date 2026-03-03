import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getEnvOverrides, mergeWithEnv, type EnvOverrides } from '@/lib/env-overrides'

const KEY = 'env_overrides'

export const dynamic = 'force-dynamic'

/** GET – aktuelle Werte (Overrides aus DB + ENV-Fallback) für Admin-Formular – nur Inhaber */
export async function GET() {
  const { isOwner } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Nur der Inhaber kann Einstellungen ansehen.' }, { status: 403 })
  const overrides = await getEnvOverrides()
  const merged = mergeWithEnv(overrides)
  return NextResponse.json({
    overrides: {
      company_name: overrides.company_name ?? '',
      company_address: overrides.company_address ?? '',
      company_postal_code: overrides.company_postal_code ?? '',
      company_city: overrides.company_city ?? '',
      company_country: overrides.company_country ?? '',
      company_vat_id: overrides.company_vat_id ?? '',
      company_email: overrides.company_email ?? '',
      company_phone: overrides.company_phone ?? '',
      company_represented_by: overrides.company_represented_by ?? '',
      support_hours: overrides.support_hours ?? '',
      site_url: overrides.site_url ?? '',
      site_name: overrides.site_name ?? '',
      resend_from_email: overrides.resend_from_email ?? '',
      delivery_estimate_days: overrides.delivery_estimate_days ?? '',
    },
    merged: {
      company_name: merged.company_name,
      company_address: merged.company_address,
      company_postal_code: merged.company_postal_code,
      company_city: merged.company_city,
      company_country: merged.company_country,
      company_email: merged.company_email,
      support_hours: merged.support_hours,
      site_url: merged.site_url,
      site_name: merged.site_name,
    },
  })
}

/** PATCH – Overrides speichern (nur gesendete Felder überschreiben) */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  const allowed: (keyof EnvOverrides)[] = [
    'company_name', 'company_address', 'company_postal_code', 'company_city', 'company_country',
    'company_vat_id', 'company_email', 'company_phone', 'company_represented_by',
    'support_hours', 'site_url', 'site_name', 'resend_from_email', 'delivery_estimate_days',
  ]
  const current = await getEnvOverrides()
  const next: EnvOverrides = { ...current }
  for (const k of allowed) {
    if (Object.prototype.hasOwnProperty.call(body, k)) {
      const v = body[k]
      if (typeof v === 'string') {
        const trimmed = v.trim()
        next[k] = trimmed || undefined
      }
    }
  }
  const admin = createSupabaseAdmin()
  const value = JSON.stringify(next)
  const { error } = await admin.from('site_settings').upsert({ key: KEY, value }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
