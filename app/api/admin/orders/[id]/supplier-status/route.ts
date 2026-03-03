import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Lieferanten-Übermittlungsstatus für eine Bestellung */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const orderId = params?.id
  if (!orderId) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: items } = await admin
    .from('order_items')
    .select('product_id')
    .eq('order_id', orderId)
  const productIds = [...new Set((items || []).map((i: { product_id?: string }) => i.product_id).filter(Boolean))] as string[]
  let productSupplierMap: Record<string, string> = {}
  if (productIds.length > 0) {
    const { data: products } = await admin.from('products').select('id, supplier_id').in('id', productIds)
    for (const p of products || []) {
      if (p?.supplier_id) productSupplierMap[p.id] = p.supplier_id
    }
  }
  const requiredSupplierIds = new Set(Object.values(productSupplierMap))
  const { data: submissions } = await admin
    .from('order_supplier_submissions')
    .select('supplier_id')
    .eq('order_id', orderId)
  const submittedIds = new Set((submissions || []).map((s: { supplier_id: string }) => s.supplier_id))
  const supplier_submitted =
    requiredSupplierIds.size === 0 || [...requiredSupplierIds].every((id) => submittedIds.has(id))

  return NextResponse.json({ supplier_submitted })
}
