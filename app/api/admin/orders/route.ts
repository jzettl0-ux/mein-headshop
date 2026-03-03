import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { canAccessOrders } from '@/lib/admin-permissions'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Alle Bestellungen (RBAC: nur Rollen mit Bestellzugriff, z. B. Support, Admin).
 */
export async function GET() {
  const { isAdmin, roles } = await getAdminContext()
  if (!isAdmin || !canAccessOrders(roles?.length ? roles : [])) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: orders, error: ordersError } = await admin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })

  if (ordersError) return NextResponse.json({ error: ordersError.message }, { status: 500 })
  if (!orders?.length) return NextResponse.json([])

  const orderIds = orders.map((o) => o.id)
  const { data: itemsData } = await admin
    .from('order_items')
    .select('order_id, product_id, product_name, quantity, price')
    .in('order_id', orderIds)

  const itemsByOrder = new Map<string, { product_name: string; quantity: number; product_id?: string }[]>()
  const productIdsByOrder = new Map<string, Set<string>>()
  if (itemsData) {
    for (const row of itemsData) {
      const list = itemsByOrder.get(row.order_id) || []
      list.push({ product_name: row.product_name, quantity: row.quantity, product_id: row.product_id })
      itemsByOrder.set(row.order_id, list)
      if (row.product_id) {
        const set = productIdsByOrder.get(row.order_id) || new Set()
        set.add(row.product_id)
        productIdsByOrder.set(row.order_id, set)
      }
    }
  }

  const allProductIds = [...new Set((itemsData || []).map((r: { product_id?: string }) => r.product_id).filter(Boolean))] as string[]
  let productSupplierMap: Record<string, string> = {}
  let productCostMap: Record<string, number> = {}
  if (allProductIds.length > 0) {
    const { data: products } = await admin.from('products').select('id, supplier_id, cost_price').in('id', allProductIds)
    for (const p of products || []) {
      if (p?.supplier_id) productSupplierMap[p.id] = p.supplier_id
      productCostMap[p.id] = Number(p.cost_price) ?? 0
    }
  }

  function estimateMollieFee(totalEur: number): number {
    return 0.29 + totalEur * 0.0025
  }
  const profitByOrderId: Record<string, number> = {}
  if (itemsData && itemsData.length > 0) {
    for (const o of orders) {
      const orderTotal = Number(o.total) ?? 0
      let revenue = 0
      let cogs = 0
      for (const it of itemsData as { order_id: string; product_id?: string; quantity: number; price: number }[]) {
        if (it.order_id !== o.id) continue
        revenue += Number(it.price) * (Number(it.quantity) || 0)
        const cost = it.product_id ? productCostMap[it.product_id] ?? 0 : 0
        cogs += cost * (Number(it.quantity) || 0)
      }
      const fee = estimateMollieFee(orderTotal)
      profitByOrderId[o.id] = Math.round((revenue - cogs - fee) * 100) / 100
    }
  }

  const { data: submissions } = await admin
    .from('order_supplier_submissions')
    .select('order_id, supplier_id')
    .in('order_id', orderIds)

  const submittedByOrder = new Map<string, Set<string>>()
  if (submissions) {
    for (const s of submissions) {
      const set = submittedByOrder.get(s.order_id) || new Set()
      set.add(s.supplier_id)
      submittedByOrder.set(s.order_id, set)
    }
  }

  const ordersWithItems = orders.map((order) => {
    const productIds = productIdsByOrder.get(order.id)
    const requiredSupplierIds = new Set<string>()
    if (productIds) {
      for (const pid of productIds) {
        const sid = productSupplierMap[pid]
        if (sid) requiredSupplierIds.add(sid)
      }
    }
    const submittedIds = submittedByOrder.get(order.id) || new Set()
    const supplier_submitted =
      requiredSupplierIds.size === 0 || [...requiredSupplierIds].every((id) => submittedIds.has(id))

    return {
      ...order,
      items_count: itemsByOrder.get(order.id)?.length ?? 0,
      items_preview: itemsByOrder.get(order.id)?.map((i) => ({ product_name: i.product_name, quantity: i.quantity })) ?? [],
      supplier_submitted,
      profit: profitByOrderId[order.id] ?? null,
    }
  })

  return NextResponse.json(ordersWithItems)
}
