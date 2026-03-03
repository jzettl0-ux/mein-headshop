/**
 * Blueprint TEIL 20.3: PATCH SFP Trial (Zähler, Status, last_evaluated_at)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const STATUSES = ['IN_PROGRESS', 'APPROVED', 'FAILED', 'REVOKED'] as const

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return Response.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.orders_shipped_count === 'number' && body.orders_shipped_count >= 0) updates.orders_shipped_count = body.orders_shipped_count
  if (typeof body.on_time_deliveries_count === 'number' && body.on_time_deliveries_count >= 0) updates.on_time_deliveries_count = body.on_time_deliveries_count
  if (typeof body.valid_tracking_count === 'number' && body.valid_tracking_count >= 0) updates.valid_tracking_count = body.valid_tracking_count
  if (STATUSES.includes(body.status)) updates.status = body.status
  if (body.last_evaluated_at !== undefined) updates.last_evaluated_at = body.last_evaluated_at ? new Date(body.last_evaluated_at).toISOString() : null
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('vendor_performance')
    .from('sfp_trials')
    .update(updates)
    .eq('trial_id', id)
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
