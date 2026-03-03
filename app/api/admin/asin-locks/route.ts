import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – ASIN-Locks mit Produktnamen laden */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ locks: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: locks, error } = await admin
      .schema('enforcement')
      .from('asin_locks')
      .select('lock_id, product_id, review_count, is_title_locked, is_category_locked, last_checked_at')

    if (error) return NextResponse.json({ locks: [] }, { status: 200 })

    const productIds = (locks ?? []).map((l) => (l as { product_id: string }).product_id).filter(Boolean)
    if (productIds.length === 0) return NextResponse.json({ locks: [] })

    const { data: products } = await admin
      .from('products')
      .select('id, name, slug')
      .in('id', productIds)
    const byId = new Map((products ?? []).map((p) => [p.id, p]))

    const enriched = (locks ?? []).map((l) => ({
      ...l,
      product_name: byId.get((l as { product_id: string }).product_id)?.name ?? '–',
      product_slug: byId.get((l as { product_id: string }).product_id)?.slug ?? null,
    }))
    return NextResponse.json({ locks: enriched })
  } catch {
    return NextResponse.json({ locks: [] }, { status: 200 })
  }
}
