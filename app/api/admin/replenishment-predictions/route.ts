import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Replenishment Predictions (Buy It Again) – Übersicht */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ predictions: [], total: 0 }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: rows, error } = await admin
      .schema('frontend_ux')
      .from('replenishment_predictions')
      .select('prediction_id, customer_id, product_id, last_purchased_date, calculated_cycle_days, next_expected_purchase_date, is_dismissed, created_at')
      .eq('is_dismissed', false)
      .order('next_expected_purchase_date', { ascending: true })
      .limit(200)

    if (error) return NextResponse.json({ predictions: [], total: 0 }, { status: 200 })

    const productIds = [...new Set((rows ?? []).map((r) => (r as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, { name: string; slug: string | null }>()
    if (productIds.length > 0) {
      const { data: products } = await admin
        .from('products')
        .select('id, name, slug')
        .in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]))
    }

    const predictions = (rows ?? []).map((r) => ({
      ...r,
      product_name: byId.get((r as { product_id: string }).product_id)?.name ?? '–',
      product_slug: byId.get((r as { product_id: string }).product_id)?.slug ?? null,
    }))

    const { count } = await admin
      .schema('frontend_ux')
      .from('replenishment_predictions')
      .select('*', { count: 'exact', head: true })
      .eq('is_dismissed', false)

    return NextResponse.json({ predictions, total: count ?? predictions.length })
  } catch {
    return NextResponse.json({ predictions: [], total: 0 }, { status: 200 })
  }
}
