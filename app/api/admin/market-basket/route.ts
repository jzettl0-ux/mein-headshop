import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Market Basket Correlations (Share of Wallet) */
export async function GET(request: Request) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ correlations: [] }, { status: 200 })

  try {
    const { searchParams } = new URL(request.url)
    const productId = searchParams.get('product_id')?.trim()
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 300)

    const admin = createSupabaseAdmin()
    let query = admin
      .schema('advanced_analytics')
      .from('market_basket_correlations')
      .select('correlation_id, anchor_product_id, associated_category, associated_brand_name, correlation_percentage, analyzed_timeframe_days, last_calculated_at')
      .order('correlation_percentage', { ascending: false })
      .limit(limit)

    if (productId) {
      query = query.eq('anchor_product_id', productId)
    }

    const { data: correlations, error } = await query

    if (error) return NextResponse.json({ correlations: [] }, { status: 200 })

    const productIds = [...new Set((correlations ?? []).map((c) => (c as { anchor_product_id: string }).anchor_product_id).filter(Boolean))]
    let byId = new Map<string, string>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, p.name]))
    }

    const enriched = (correlations ?? []).map((c) => ({
      ...c,
      anchor_product_name: byId.get((c as { anchor_product_id: string }).anchor_product_id) ?? '–',
    }))

    return NextResponse.json({ correlations: enriched })
  } catch {
    return NextResponse.json({ correlations: [] }, { status: 200 })
  }
}
