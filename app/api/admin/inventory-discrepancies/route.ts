import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – FBA Lost & Damaged Inventory Discrepancies */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ discrepancies: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: discrepancies, error } = await admin
      .schema('warehouse_ops')
      .from('inventory_discrepancies')
      .select('discrepancy_id, vendor_id, product_id, warehouse_location_id, quantity_lost_or_damaged, reason_code, status, detected_at')
      .order('detected_at', { ascending: false })
      .limit(200)

    if (error) return NextResponse.json({ discrepancies: [] }, { status: 200 })

    const productIds = [...new Set((discrepancies ?? []).map((d) => (d as { product_id: string }).product_id).filter(Boolean))]
    let byId = new Map<string, string>()
    if (productIds.length > 0) {
      const { data: products } = await admin.from('products').select('id, name').in('id', productIds)
      byId = new Map((products ?? []).map((p) => [p.id, p.name]))
    }

    const enriched = (discrepancies ?? []).map((d) => ({
      ...d,
      product_name: byId.get((d as { product_id: string }).product_id) ?? '–',
    }))

    return NextResponse.json({ discrepancies: enriched })
  } catch {
    return NextResponse.json({ discrepancies: [] }, { status: 200 })
  }
}
