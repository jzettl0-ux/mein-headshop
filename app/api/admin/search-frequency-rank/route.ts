import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Search Frequency Rank (Brand Analytics) */
export async function GET(request: Request) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ items: [] }, { status: 200 })

  try {
    const { searchParams } = new URL(request.url)
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 300)
    const term = searchParams.get('term')?.trim()

    const admin = createSupabaseAdmin()
    let query = admin
      .schema('advanced_analytics')
      .from('search_frequency_rank')
      .select('sfr_id, search_term, calculation_week, platform_rank, top_product_id_1, click_share_1, conversion_share_1, top_product_id_2, click_share_2, top_product_id_3, click_share_3')
      .order('calculation_week', { ascending: false })
      .order('platform_rank', { ascending: true })
      .limit(limit)

    if (term) {
      query = query.ilike('search_term', `%${term}%`)
    }

    const { data: items, error } = await query

    if (error) return NextResponse.json({ items: [] }, { status: 200 })

    const productIds = [...new Set(
      (items ?? [])
        .flatMap((i) => [(i as { top_product_id_1: string | null }).top_product_id_1, (i as { top_product_id_2: string | null }).top_product_id_2, (i as { top_product_id_3: string | null }).top_product_id_3])
        .filter(Boolean) as string[]
    )]
    let byId = new Map<string, string>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, p.name]))
    }

    const enriched = (items ?? []).map((i) => ({
      ...i,
      top_product_name_1: (i as { top_product_id_1: string | null }).top_product_id_1 ? byId.get((i as { top_product_id_1: string }).top_product_id_1) ?? null : null,
      top_product_name_2: (i as { top_product_id_2: string | null }).top_product_id_2 ? byId.get((i as { top_product_id_2: string }).top_product_id_2) ?? null : null,
      top_product_name_3: (i as { top_product_id_3: string | null }).top_product_id_3 ? byId.get((i as { top_product_id_3: string }).top_product_id_3) ?? null : null,
    }))

    return NextResponse.json({ items: enriched })
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}
