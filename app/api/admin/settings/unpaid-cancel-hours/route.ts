import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
const KEY = 'unpaid_cancel_hours'
const DEFAULT_HOURS = 48

/**
 * GET – Admin: Stunden nach denen unbezahlte Bestellungen automatisch storniert werden (0 = deaktiviert).
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  let hours = DEFAULT_HOURS
  if (data?.value != null) {
    const n = typeof data.value === 'string' ? parseInt(data.value, 10) : Number(data.value)
    if (!Number.isNaN(n) && n >= 0) hours = Math.min(999, Math.floor(n))
  }
  return NextResponse.json({ unpaid_cancel_hours: hours })
}

/**
 * PATCH – Admin: Stunden setzen. Body: { unpaid_cancel_hours: number }. 0 = Auto-Stornierung deaktiviert.
 */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  let hours = typeof body.unpaid_cancel_hours === 'number' ? body.unpaid_cancel_hours : parseInt(body.unpaid_cancel_hours, 10)
  if (Number.isNaN(hours) || hours < 0) hours = 0
  hours = Math.min(999, Math.floor(hours))

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('site_settings').upsert({ key: KEY, value: String(hours) }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ unpaid_cancel_hours: hours })
}
