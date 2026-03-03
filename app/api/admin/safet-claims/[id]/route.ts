import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Claim-Detail */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params)
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('seller_services')
    .from('safet_claims')
    .select('*')
    .eq('claim_id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Claim nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

/** PATCH – Status/Granted Amount aktualisieren */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params)
  const body = await req.json().catch(() => ({}))
  const { status, granted_amount, admin_notes } = body

  const updates: Record<string, unknown> = {}
  if (status && ['UNDER_INVESTIGATION', 'AWAITING_SELLER_INFO', 'GRANTED', 'DENIED'].includes(status)) {
    updates.status = status
    if (status === 'GRANTED' || status === 'DENIED') {
      updates.resolved_at = new Date().toISOString()
    }
  }
  if (granted_amount != null) updates.granted_amount = Number(granted_amount)
  if (typeof admin_notes === 'string') updates.admin_notes = admin_notes

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('seller_services')
    .from('safet_claims')
    .update(updates)
    .eq('claim_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
