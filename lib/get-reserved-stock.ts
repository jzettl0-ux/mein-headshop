import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * Summe der nicht abgelaufenen Reservierungen pro product_id.
 * Wird für Checkout und Anzeige "verfügbarer Bestand" genutzt.
 */
export async function getReservedByProductIds(
  productIds: string[]
): Promise<Record<string, number>> {
  if (!hasSupabaseAdmin() || productIds.length === 0) return {}
  try {
    const admin = createSupabaseAdmin()
    const { data } = await admin
      .from('stock_reservations')
      .select('product_id, quantity')
      .in('product_id', productIds)
      .gt('expires_at', new Date().toISOString())
    const out: Record<string, number> = {}
    for (const row of data || []) {
      const id = row.product_id as string
      out[id] = (out[id] ?? 0) + Math.max(0, Number(row.quantity) ?? 0)
    }
    return out
  } catch {
    return {}
  }
}
