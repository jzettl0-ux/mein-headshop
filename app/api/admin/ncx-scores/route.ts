import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – NCX-Scores (Voice of the Customer) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ scores: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: scores, error } = await admin
      .schema('advanced_analytics')
      .from('ncx_scores')
      .select('ncx_id, product_id, vendor_id, evaluation_period_days, total_orders, negative_returns, negative_reviews, negative_messages, total_negative_signals, ncx_rate, is_suppressed, last_calculated_at')
      .order('ncx_rate', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ scores: [] }, { status: 200 })

    const productIds = [...new Set((scores ?? []).map((s) => (s as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, { name: string; slug: string | null }>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name, slug').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]))
    }

    const enriched = (scores ?? []).map((s) => ({
      ...s,
      product_name: byId.get((s as { product_id: string }).product_id)?.name ?? '–',
      product_slug: byId.get((s as { product_id: string }).product_id)?.slug ?? null,
    }))

    return NextResponse.json({ scores: enriched })
  } catch {
    return NextResponse.json({ scores: [] }, { status: 200 })
  }
}
