import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const KEY = 'company_address'

export const dynamic = 'force-dynamic'

/** GET – Firmenadresse (für Lieferanten-Bestellvorlage) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  return NextResponse.json({ company_address: (data?.value && String(data.value).trim()) || '' })
}

/** POST – Firmenadresse speichern. Body: { company_address: string } */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  const value = typeof body.company_address === 'string' ? body.company_address.trim() : ''
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('site_settings').upsert({ key: KEY, value }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
