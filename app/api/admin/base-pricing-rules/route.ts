import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – PAngV Grundpreis-Regeln */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ rules: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: rules, error } = await admin
      .schema('legal_compliance')
      .from('base_pricing_rules')
      .select('rule_id, product_id, net_content_value, net_content_unit, reference_value, base_price_multiplier, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ rules: [] }, { status: 200 })

    const productIds = [...new Set((rules ?? []).map((r) => (r as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, { name: string; slug: string | null }>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name, slug').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]))
    }

    const enriched = (rules ?? []).map((r) => ({
      ...r,
      product_name: byId.get((r as { product_id: string }).product_id)?.name ?? '–',
      product_slug: byId.get((r as { product_id: string }).product_id)?.slug ?? null,
    }))

    return NextResponse.json({ rules: enriched })
  } catch {
    return NextResponse.json({ rules: [] }, { status: 200 })
  }
}
