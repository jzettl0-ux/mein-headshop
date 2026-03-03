import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const KEY = 'newsletter_discount_code'

/** GET – Willkommens-Rabattcode für Newsletter-Anmeldung lesen */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  return NextResponse.json({ newsletter_discount_code: data?.value ?? '' })
}

/** PATCH – Willkommens-Rabattcode setzen (z. B. "WILLKOMMEN10" für 10 % Rabatt) */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const value = typeof body.newsletter_discount_code === 'string' ? body.newsletter_discount_code.trim().toUpperCase() : ''

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('site_settings').upsert({ key: KEY, value }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ newsletter_discount_code: value })
}
