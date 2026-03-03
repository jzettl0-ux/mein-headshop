import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('infrastructure')
    .from('epr_registrations')
    .select('*, vendor_accounts(id, business_name)')
    .order('last_verified_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const vendorId = body.vendor_id
  const eprType = ['LUCID_PACKAGING', 'WEEE_ELECTRONICS', 'BATT_G_BATTERIES'].includes(body.epr_type)
    ? body.epr_type
    : 'LUCID_PACKAGING'
  const regNum = typeof body.registration_number === 'string' ? body.registration_number.trim() : ''
  if (!vendorId || !regNum)
    return NextResponse.json({ error: 'vendor_id und registration_number erforderlich' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('infrastructure')
    .from('epr_registrations')
    .upsert(
      { vendor_id: vendorId, epr_type: eprType, registration_number: regNum, verification_status: 'PENDING' },
      { onConflict: 'vendor_id,epr_type' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
