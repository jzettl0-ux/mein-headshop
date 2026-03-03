import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – CRAP-Metriken (Net PPM, Add-on, Suppressed) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ metrics: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: metrics, error } = await admin
      .schema('financial_defense')
      .from('crap_metrics')
      .select('crap_id, product_id, vendor_id, asin, calculated_net_ppm, action_taken, last_evaluated_at')
      .order('last_evaluated_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ metrics: [] }, { status: 200 })

    const productIds = [...new Set((metrics ?? []).map((m) => (m as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, string>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, p.name]))
    }

    const enriched = (metrics ?? []).map((m) => ({
      ...m,
      product_name: m.product_id ? byId.get(m.product_id) ?? '–' : '–',
    }))

    return NextResponse.json({ metrics: enriched })
  } catch {
    return NextResponse.json({ metrics: [] }, { status: 200 })
  }
}
