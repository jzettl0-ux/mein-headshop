import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/**
 * GET – Inventory Intelligence: Verkäufe letzte 30 Tage pro Produkt,
 * Durchschnitt pro Tag, geschätzte Tage bis Ausverkauf, Warnstufen.
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const since = new Date()
  since.setDate(since.getDate() - 30)

  const { data: orders } = await admin
    .from('orders')
    .select('id')
    .eq('payment_status', 'paid')
    .gte('created_at', since.toISOString())

  const orderIds = (orders ?? []).map((o) => o.id)
  let items: { product_id: string; quantity: number }[] = []
  if (orderIds.length > 0) {
    const { data: orderItems } = await admin
      .from('order_items')
      .select('product_id, quantity')
      .in('order_id', orderIds)
    items = (orderItems ?? [])
      .filter((i) => i.product_id)
      .map((i) => ({ product_id: i.product_id as string, quantity: Number(i.quantity) || 0 }))
  }

  const soldByProduct: Record<string, number> = {}
  for (const it of items) {
    soldByProduct[it.product_id] = (soldByProduct[it.product_id] ?? 0) + it.quantity
  }

  const { data: products } = await admin
    .from('products')
    .select('id, name, slug, stock, price, discount_percent, discount_until')
  const DAYS = 30
  let minStockByProduct: Record<string, number> = {}
  try {
    const { data: prodsMin } = await admin.from('products').select('id, min_stock_level')
    if (prodsMin) for (const p of prodsMin) minStockByProduct[p.id] = Math.max(0, Number((p as { min_stock_level?: number }).min_stock_level) ?? 0)
  } catch {
    // min_stock_level optional
  }
  const rows = (products ?? []).map((p) => {
    const stock = Math.max(0, Number(p.stock) ?? 0)
    const minLevel = minStockByProduct[p.id] ?? 0
    const sold = soldByProduct[p.id] ?? 0
    const avgPerDay = DAYS > 0 ? sold / DAYS : 0
    let daysUntilEmpty: number | null = null
    if (avgPerDay > 0) daysUntilEmpty = Math.floor(stock / avgPerDay)
    else if (stock > 0) daysUntilEmpty = 999
    const isRed = minLevel > 0 && stock < minLevel
    const isYellow = daysUntilEmpty !== null && daysUntilEmpty < 7 && daysUntilEmpty >= 0 && !isRed
    const price = Number((p as { price?: number }).price) ?? 0
    const discountPercent = Number((p as { discount_percent?: number }).discount_percent) ?? 0
    const discountUntil = (p as { discount_until?: string | null }).discount_until
    const hasActiveDiscount = discountPercent > 0 && (!discountUntil || new Date(discountUntil) >= new Date())
    const effectivePrice = hasActiveDiscount
      ? Math.round(price * (1 - discountPercent / 100) * 100) / 100
      : price

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      stock,
      min_stock_level: minLevel,
      sold_last_30_days: sold,
      avg_sales_per_day: Math.round(avgPerDay * 100) / 100,
      days_until_empty: daysUntilEmpty,
      warning: isRed ? 'red' : isYellow ? 'yellow' : null,
      price,
      effective_price: effectivePrice,
      has_discount: hasActiveDiscount,
    }
  })

  return NextResponse.json({ items: rows })
}
