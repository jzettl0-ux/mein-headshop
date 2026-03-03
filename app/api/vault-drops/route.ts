/**
 * Blueprint Teil 4.6: 4:20 Vault – öffentliche API für aktive Drops
 */
import { NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!hasSupabaseAdmin()) return NextResponse.json({ drops: [] })
  const admin = createSupabaseAdmin()
  const now = new Date().toISOString()

  try {
    const { data: dropsRaw, error } = await admin
      .schema('gamification')
      .from('vault_drops')
      .select('drop_id, product_id, drop_price, total_units_available, units_sold, units_locked_in_carts, start_timestamp, end_timestamp, status')
      .eq('status', 'ACTIVE')
      .lte('start_timestamp', now)
      .gte('end_timestamp', now)

    if (error) {
      console.error('[vault-drops]', error.message)
      return NextResponse.json({ drops: [] })
    }

    const drops = (dropsRaw ?? []).filter(
      (d: { units_sold?: number; total_units_available?: number }) => (d.units_sold ?? 0) < (d.total_units_available ?? 1)
    )
    if (drops.length === 0) return NextResponse.json({ drops: [] })

    const productIds = [...new Set(drops.map((d: { product_id: string }) => d.product_id))]
    const { data: prods } = await admin.from('products').select('id, name, slug, image_url, price, images, category, stock').in('id', productIds)
    const prodMap = new Map((prods ?? []).map((p: { id: string }) => [p.id, p]))

    const result = drops.map((d: Record<string, unknown>) => ({
      ...d,
      products: prodMap.get(d.product_id as string) ?? null,
    }))
    return NextResponse.json({ drops: result })
  } catch (e) {
    console.error('[vault-drops]', e)
    return NextResponse.json({ drops: [] })
  }
}
