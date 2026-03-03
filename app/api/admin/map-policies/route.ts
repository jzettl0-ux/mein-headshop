import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – MAP (Minimum Advertised Price) Policies */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ policies: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: policies, error } = await admin
      .schema('brand_enforcement')
      .from('map_policies')
      .select('policy_id, brand_registry_id, product_id, minimum_advertised_price, enforcement_action, is_active, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ policies: [] }, { status: 200 })

    const productIds = [...new Set((policies ?? []).map((p) => (p as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, string>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, p.name]))
    }

    const enriched = (policies ?? []).map((p) => ({
      ...p,
      product_name: byId.get((p as { product_id: string }).product_id) ?? '–',
    }))

    return NextResponse.json({ policies: enriched })
  } catch {
    return NextResponse.json({ policies: [] }, { status: 200 })
  }
}
