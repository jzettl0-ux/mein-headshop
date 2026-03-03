import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Vendor Performance Metrics (ODR, LSR, VTR) */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('vendor_performance_metrics')
    .select('*')
    .eq('vendor_id', id)
    .single()

  if (error && error.code !== 'PGRST116') return NextResponse.json({ error: error.message }, { status: 500 })
  if (!data) {
    return NextResponse.json({
      vendor_id: id,
      order_defect_rate: 0,
      late_shipment_rate: 0,
      pre_fulfillment_cancellation_rate: 0,
      valid_tracking_rate: 1,
      is_buybox_eligible: true,
    })
  }
  return NextResponse.json(data)
}

/** PATCH – Vendor Metrics aktualisieren (manuell oder Cron) */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await context.params
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const admin = createSupabaseAdmin()

  const updates: Record<string, unknown> = {}
  const allowed = ['order_defect_rate', 'late_shipment_rate', 'pre_fulfillment_cancellation_rate', 'valid_tracking_rate', 'is_buybox_eligible', 'response_time_avg_hours']
  for (const key of allowed) {
    if (body[key] === undefined) continue
    if (key === 'is_buybox_eligible') updates[key] = Boolean(body[key])
    else if (key === 'response_time_avg_hours') updates[key] = body[key] != null ? Number(body[key]) : null
    else updates[key] = Math.max(0, Math.min(1, Number(body[key]) ?? 0))
  }
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderungen' }, { status: 400 })

  const { data, error } = await admin
    .from('vendor_performance_metrics')
    .upsert(
      { vendor_id: id, ...updates, calculation_date: new Date().toISOString().slice(0, 10), updated_at: new Date().toISOString() },
      { onConflict: 'vendor_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
