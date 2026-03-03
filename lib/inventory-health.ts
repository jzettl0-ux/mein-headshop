/**
 * Inventory Health: Safety Stock, Reorder Point, Restock-Warnung
 * Berechnet avg_daily_sales aus order_items (30 Tage), aktualisiert analytics.inventory_health
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const DAYS_LOOKBACK = 30
const DEFAULT_LEAD_TIME_DAYS = 14

export interface InventoryHealthResult {
  processed: number
  needsRestock: number
  errors: string[]
}

/** Berechnet Inventory Health für alle Vendor-Angebote */
export async function calculateInventoryHealth(
  admin?: SupabaseClient
): Promise<InventoryHealthResult> {
  const { createSupabaseAdmin, hasSupabaseAdmin } = await import('@/lib/supabase-admin')
  const client = admin ?? (hasSupabaseAdmin() ? createSupabaseAdmin() : null)
  if (!client) return { processed: 0, needsRestock: 0, errors: ['Service nicht verfügbar'] }

  const result: InventoryHealthResult = { processed: 0, needsRestock: 0, errors: [] }

  const since = new Date()
  since.setDate(since.getDate() - DAYS_LOOKBACK)
  const sinceIso = since.toISOString()

  const { data: offers } = await client
    .from('vendor_offers')
    .select('id, vendor_id, product_id, stock')
    .eq('is_active', true)

  if (!offers?.length) return result

  const { data: sales } = await client
    .from('order_items')
    .select('offer_id, quantity, order_id')
    .not('offer_id', 'is', null)
    .gte('created_at', sinceIso)

  const orderItemRows = (sales ?? []) as { offer_id: string; quantity: number; order_id: string }[]
  const orderIds = [...new Set(orderItemRows.map((r) => r.order_id))].filter(Boolean)

  let paidOrderIds = new Set<string>()
  if (orderIds.length > 0) {
    const { data: orders } = await client
      .from('orders')
      .select('id')
      .eq('payment_status', 'paid')
      .in('id', orderIds)
    paidOrderIds = new Set((orders ?? []).map((o: { id: string }) => o.id))
  }

  const soldByOffer: Record<string, number> = {}
  for (const oi of orderItemRows) {
    if (!oi.offer_id) continue
    if (!paidOrderIds.has(oi.order_id)) continue
    soldByOffer[oi.offer_id] = (soldByOffer[oi.offer_id] ?? 0) + (oi.quantity ?? 0)
  }

  for (const offer of offers as { id: string; vendor_id: string; product_id: string; stock: number }[]) {
    try {
      const sold = soldByOffer[offer.id] ?? 0
      const avgDailySales = sold / DAYS_LOOKBACK
      const currentStock = Number(offer.stock ?? 0)
      const leadTime = DEFAULT_LEAD_TIME_DAYS
      const safetyStock = Math.ceil(avgDailySales * 7)
      const reorderPoint = Math.ceil(avgDailySales * leadTime) + safetyStock
      const needsRestock = currentStock <= reorderPoint

      const { error } = await client
        .schema('analytics')
        .from('inventory_health')
        .upsert(
          {
            vendor_id: offer.vendor_id,
            offer_id: offer.id,
            avg_daily_sales: Math.round(avgDailySales * 100) / 100,
            supplier_lead_time_days: leadTime,
            calculated_safety_stock: safetyStock,
            calculated_reorder_point: reorderPoint,
            current_stock: currentStock,
            needs_restock: needsRestock,
            last_calculated_at: new Date().toISOString(),
          },
          { onConflict: 'vendor_id,offer_id' }
        )

      if (error) {
        result.errors.push(`${offer.id}: ${error.message}`)
        continue
      }
      result.processed++
      if (needsRestock) result.needsRestock++
    } catch (e) {
      result.errors.push(`${offer.id}: ${(e as Error).message}`)
    }
  }

  return result
}
