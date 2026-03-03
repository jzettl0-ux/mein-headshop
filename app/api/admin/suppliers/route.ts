import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Liste aller Lieferanten */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.from('suppliers').select('*').order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Lieferant anlegen. Body: name, email?, api_endpoint?, api_key?, type? ('email'|'api') */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  if (!name) return NextResponse.json({ error: 'name ist erforderlich' }, { status: 400 })

  const type = body.type === 'api' ? 'api' : body.type === 'manual' ? 'manual' : 'email'
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('suppliers')
    .insert({
      name,
      contact_email: body.email?.trim() || body.contact_email?.trim() || null,
      contact_phone: body.contact_phone?.trim() || null,
      contact_person: body.contact_person?.trim() || null,
      order_email: body.order_email?.trim() || null,
      website: body.website?.trim() || null,
      notes: body.notes?.trim() || null,
      minimum_order_value: body.minimum_order_value != null ? Number(body.minimum_order_value) : null,
      payment_terms: body.payment_terms?.trim() || null,
      api_capable: type === 'api',
      connector_type: type === 'api' ? 'mock_influencer' : null,
      type,
      api_endpoint: body.api_endpoint?.trim() || null,
      api_key: body.api_key?.trim() || null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
