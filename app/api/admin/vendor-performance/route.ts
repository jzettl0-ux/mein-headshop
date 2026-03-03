import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET – Vendor Performance: ODR, LSR, VTR, is_buybox_eligible.
 * Alerts: ODR > 1%, LSR > 4%, VTR < 95%.
 */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('vendor_performance_metrics')
    .select(`
      *,
      vendor_accounts(id, company_name, contact_email, is_active)
    `)
    .order('calculation_date', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    odr: Number(r.order_defect_rate ?? 0),
    lsr: Number(r.late_shipment_rate ?? 0),
    vtr: Number(r.valid_tracking_rate ?? 1),
    odrAlert: Number(r.order_defect_rate ?? 0) > 0.01,
    lsrAlert: Number(r.late_shipment_rate ?? 0) > 0.04,
    vtrAlert: Number(r.valid_tracking_rate ?? 1) < 0.95,
  }))

  const alerts = rows.filter(
    (r: { odrAlert?: boolean; lsrAlert?: boolean; vtrAlert?: boolean }) =>
      r.odrAlert || r.lsrAlert || r.vtrAlert
  )

  return NextResponse.json({ metrics: rows, alerts })
}
