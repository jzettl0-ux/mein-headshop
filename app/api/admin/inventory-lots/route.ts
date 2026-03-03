import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – FEFO Lot-Tracking (Chargen, MHD, Regalplatz) */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ lots: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: lots, error } = await admin
      .schema('wms_fefo')
      .from('inventory_lots')
      .select('lot_id, product_id, vendor_id, manufacturer_batch_number, expiration_date, quantity_available, warehouse_bin_location, status, received_at')
      .order('expiration_date', { ascending: true })
      .limit(500)

    if (error) return NextResponse.json({ lots: [] }, { status: 200 })

    const productIds = [...new Set((lots ?? []).map((l) => (l as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, string>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, p.name]))
    }

    const enriched = (lots ?? []).map((l) => ({
      ...l,
      product_name: l.product_id ? byId.get(l.product_id) ?? '–' : '–',
    }))

    return NextResponse.json({ lots: enriched })
  } catch {
    return NextResponse.json({ lots: [] }, { status: 200 })
  }
}
