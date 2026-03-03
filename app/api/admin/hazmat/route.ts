import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Gefahrgut/Produktsicherheit (Hazmat) laden */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ items: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: items, error } = await admin
      .schema('compliance_hazmat')
      .from('product_safety_data')
      .select('hazmat_id, product_id, vendor_id, contains_batteries, battery_type, is_flammable_liquid, un_number, safety_data_sheet_url, approval_status, updated_at')
      .order('updated_at', { ascending: false })

    if (error) return NextResponse.json({ items: [] }, { status: 200 })

    const productIds = [...new Set((items ?? []).map((i) => (i as { product_id: string | null }).product_id).filter(Boolean) as string[])]
    if (productIds.length === 0) return NextResponse.json({ items: items ?? [] })

    const { data: products } = await admin
      .from('products')
      .select('id, name, slug')
      .in('id', productIds)
    const byId = new Map((products ?? []).map((p) => [p.id, { name: p.name, slug: p.slug }]))

    const enriched = (items ?? []).map((i) => ({
      ...i,
      product_name: (i as { product_id: string | null }).product_id
        ? (byId.get((i as { product_id: string }).product_id)?.name ?? '–')
        : '–',
      product_slug: (i as { product_id: string | null }).product_id
        ? (byId.get((i as { product_id: string }).product_id)?.slug ?? null)
        : null,
    }))
    return NextResponse.json({ items: enriched })
  } catch {
    return NextResponse.json({ items: [] }, { status: 200 })
  }
}
