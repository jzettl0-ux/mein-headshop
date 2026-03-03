import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Velocity-Anomalien (Preis-Drop, Sales-Spike → Account Frozen) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ anomalies: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: anomalies, error } = await admin
      .schema('financial_defense')
      .from('velocity_anomalies')
      .select('anomaly_id, vendor_id, product_id, anomaly_type, trigger_value, action_taken, requires_2fa_unlock, resolved_at, detected_at')
      .order('detected_at', { ascending: false })
      .limit(100)

    if (error) return NextResponse.json({ anomalies: [] }, { status: 200 })

    const productIds = [...new Set((anomalies ?? []).map((a) => (a as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, string>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, p.name]))
    }

    const enriched = (anomalies ?? []).map((a) => ({
      ...a,
      product_name: a.product_id ? byId.get(a.product_id) ?? '–' : '–',
    }))

    return NextResponse.json({ anomalies: enriched })
  } catch {
    return NextResponse.json({ anomalies: [] }, { status: 200 })
  }
}
