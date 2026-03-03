import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/lightning-deals
 * Öffentlich: Aktive Lightning Deals für Shop-Anzeige (Countdown, Kontingent).
 */
export async function GET() {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json([])
  }

  const now = new Date().toISOString()
  const admin = createSupabaseAdmin()

  try {
    const { data: dealsRaw, error } = await admin
      .schema('promotions')
      .from('lightning_deals')
      .select('deal_id, product_id, deal_price, original_price, quantity_total, quantity_claimed, start_at, end_at')
      .in('status', ['scheduled', 'active'])
      .lte('start_at', now)
      .gte('end_at', now)
      .order('end_at', { ascending: true })

    if (error) {
      console.error('[lightning-deals]', error.message)
      return NextResponse.json([])
    }

    const deals = (dealsRaw ?? []).filter((d: { quantity_claimed?: number; quantity_total?: number }) => (d.quantity_claimed ?? 0) < (d.quantity_total ?? 1))
    if (deals.length === 0) return NextResponse.json([])

    const productIds = [...new Set(deals.map((d: { product_id: string }) => d.product_id))]
    const { data: prods } = await admin.from('products').select('id, name, slug, image_url, price, images, category').in('id', productIds)
    const prodMap = new Map((prods ?? []).map((p: { id: string }) => [p.id, p]))

    const result = deals.map((d: Record<string, unknown>) => ({
      ...d,
      products: prodMap.get(d.product_id as string) ?? null,
    }))
    return NextResponse.json(result)
  } catch (e) {
    console.error('[lightning-deals]', e)
    return NextResponse.json([])
  }
}
