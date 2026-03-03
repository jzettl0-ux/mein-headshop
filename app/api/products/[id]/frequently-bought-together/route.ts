/**
 * Blueprint Teil 8.26: Frequently Bought Together
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const productId = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!productId) return NextResponse.json({ products: [] })
  if (!hasSupabaseAdmin()) return NextResponse.json({ products: [] })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('infrastructure')
    .from('frequently_bought_together')
    .select('associated_product_id, co_occurrence_count, bundle_discount_percentage')
    .eq('anchor_product_id', productId)
    .gt('co_occurrence_count', 0)
    .order('co_occurrence_count', { ascending: false })
    .limit(6)
  if (error) return NextResponse.json({ products: [] })
  if (!data?.length) return NextResponse.json({ products: [] })
  const ids = (data as { associated_product_id: string }[]).map((r) => r.associated_product_id)
  const { data: products } = await admin.from('products').select('id, name, slug, price, image_url').in('id', ids)
  const order = Object.fromEntries(ids.map((id, i) => [id, i]))
  const sorted = (products ?? []).sort((a, b) => (order[a.id] ?? 99) - (order[b.id] ?? 99))
  const withDiscount = sorted.map((p) => {
    const fbt = data.find((r: { associated_product_id: string }) => r.associated_product_id === p.id) as { bundle_discount_percentage?: number }
    return { ...p, bundle_discount_percentage: fbt?.bundle_discount_percentage ?? 0 }
  })
  return NextResponse.json({ products: withDiscount })
}
