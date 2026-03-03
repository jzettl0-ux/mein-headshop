import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – B2B RFQ (Angebotsanfragen) laden */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ quotes: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: quotes, error } = await admin
      .schema('b2b_negotiation')
      .from('quote_requests')
      .select('quote_id, b2b_customer_id, product_id, requested_quantity, requested_target_price_total, status, expires_at, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ quotes: [] }, { status: 200 })

    const productIds = [...new Set((quotes ?? []).map((q) => (q as { product_id: string }).product_id).filter(Boolean))]
    if (productIds.length === 0) return NextResponse.json({ quotes: quotes ?? [] })

    const { data: products } = await admin
      .from('products')
      .select('id, name, slug')
      .in('id', productIds)
    const byId = new Map((products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]))

    const enriched = (quotes ?? []).map((q) => ({
      ...q,
      product_name: byId.get((q as { product_id: string }).product_id)?.name ?? '–',
      product_slug: byId.get((q as { product_id: string }).product_id)?.slug ?? null,
    }))
    return NextResponse.json({ quotes: enriched })
  } catch {
    return NextResponse.json({ quotes: [] }, { status: 200 })
  }
}
