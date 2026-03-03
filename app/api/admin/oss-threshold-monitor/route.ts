import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – OSS Threshold Monitor (EU 10k€ Cross-Border) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ monitors: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: monitors, error } = await admin
      .schema('financial_defense')
      .from('oss_threshold_monitor')
      .select('monitor_id, vendor_id, target_country_code, ttm_cross_border_revenue, legal_threshold, oss_registration_provided, oss_tax_number, warning_sent_at, last_calculated_at')
      .order('ttm_cross_border_revenue', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ monitors: [] }, { status: 200 })

    const enriched = (monitors ?? []).map((m) => ({
      ...m,
      export_blocked: m.ttm_cross_border_revenue >= m.legal_threshold && !m.oss_registration_provided,
      warning_threshold: m.legal_threshold * 0.8,
    }))

    return NextResponse.json({ monitors: enriched })
  } catch {
    return NextResponse.json({ monitors: [] }, { status: 200 })
  }
}
