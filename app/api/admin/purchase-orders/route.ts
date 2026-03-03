import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Vendor Central Purchase Orders */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ purchaseOrders: [] }, { status: 200 })

  try {
    const admin = createSupabaseAdmin()
    const { data: pos, error } = await admin
      .schema('vendor_central')
      .from('purchase_orders')
      .select('po_id, supplier_id, target_warehouse_id, total_cost_value, expected_delivery_date, status, created_at')
      .order('created_at', { ascending: false })

    if (error) return NextResponse.json({ purchaseOrders: [] }, { status: 200 })

    const supplierIds = [...new Set((pos ?? []).map((p) => (p as { supplier_id: string }).supplier_id).filter(Boolean))]
    let bySupplier = new Map<string, string>()
    if (supplierIds.length > 0) {
      const { data: suppliers } = await admin
        .schema('vendor_central')
        .from('suppliers')
        .select('supplier_id, legal_name')
        .in('supplier_id', supplierIds)
      bySupplier = new Map((suppliers ?? []).map((s) => [s.supplier_id, s.legal_name]))
    }

    const enriched = (pos ?? []).map((p) => ({
      ...p,
      supplier_name: bySupplier.get((p as { supplier_id: string }).supplier_id) ?? '–',
    }))

    return NextResponse.json({ purchaseOrders: enriched })
  } catch {
    return NextResponse.json({ purchaseOrders: [] }, { status: 200 })
  }
}
