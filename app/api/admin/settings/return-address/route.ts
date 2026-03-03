import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import type { ReturnAddress } from '@/lib/shipping-settings'

const KEY = 'return_address'

export const dynamic = 'force-dynamic'

/** GET – Rücksendeadresse laden */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data } = await admin.from('site_settings').select('value').eq('key', KEY).maybeSingle()
  const raw = data?.value
  let value: Partial<ReturnAddress> = {}
  if (raw && typeof raw === 'string') {
    try {
      value = JSON.parse(raw) as Partial<ReturnAddress>
    } catch {
      /* ignore */
    }
  }
  return NextResponse.json({
    return_address: {
      name: value.name ?? '',
      name2: value.name2 ?? '',
      street: value.street ?? '',
      house_number: value.house_number ?? '',
      postal_code: value.postal_code ?? '',
      city: value.city ?? '',
      country: value.country ?? '',
      email: value.email ?? '',
      phone: value.phone ?? '',
    },
  })
}

/** PATCH – Rücksendeadresse speichern */
export async function PATCH(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  const body = await req.json().catch(() => ({}))
  const ra: Partial<ReturnAddress> = {
    name: typeof body.name === 'string' ? body.name.trim() : '',
    name2: typeof body.name2 === 'string' ? body.name2.trim() : undefined,
    street: typeof body.street === 'string' ? body.street.trim() : '',
    house_number: typeof body.house_number === 'string' ? body.house_number.trim() : '',
    postal_code: typeof body.postal_code === 'string' ? body.postal_code.trim() : '',
    city: typeof body.city === 'string' ? body.city.trim() : '',
    country: typeof body.country === 'string' ? body.country.trim() : '',
    email: typeof body.email === 'string' ? body.email.trim() : undefined,
    phone: typeof body.phone === 'string' ? body.phone.trim() : undefined,
  }
  const value = JSON.stringify(ra)
  const admin = createSupabaseAdmin()
  const { error } = await admin.from('site_settings').upsert({ key: KEY, value }, { onConflict: 'key' })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
