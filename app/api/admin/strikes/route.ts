import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const VALID_REASONS = ['REGEX_VIOLATION', 'OFF_PLATFORM_POACHING', 'MANUAL_ADMIN'] as const

/** GET – Strike-Log (optional ?vendor_id=) */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ strikes: [] })

  const vendorId = request.nextUrl.searchParams.get('vendor_id')
  const admin = createSupabaseAdmin()
  let q = admin.schema('communications').from('strike_log').select('*').order('created_at', { ascending: false })
  if (vendorId) q = q.eq('vendor_id', vendorId)
  const { data, error } = await q

  if (error) return NextResponse.json({ strikes: [], error: error.message }, { status: 200 })
  return NextResponse.json({ strikes: data ?? [] })
}

/** POST – Strike manuell eintragen (MANUAL_ADMIN) */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const vendor_id = body.vendor_id
  const strike_reason = VALID_REASONS.includes(body.strike_reason) ? body.strike_reason : 'MANUAL_ADMIN'
  if (!vendor_id) return NextResponse.json({ error: 'vendor_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('communications')
    .from('strike_log')
    .insert({ vendor_id, strike_reason, message_id: body.message_id || null })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
