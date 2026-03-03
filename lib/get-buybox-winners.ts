/**
 * Buy-Box-Gewinner pro Produkt (Multi-Vendor-Checkout).
 * Nutzt mv_active_buybox_winners oder product_offers als Fallback.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface BuyboxWinner {
  product_id: string
  vendor_id: string | null
  offer_id: string | null
  seller_type: 'shop' | 'vendor'
  unit_price: number
  shipping_price_eur: number
  landed_price: number
  fulfillment_type: 'fbm' | 'fba'
  stock: number
}

/**
 * Holt die Buy-Box-Gewinner für gegebene Produkt-IDs.
 * Gibt eine Map product_id → BuyboxWinner zurück.
 * Produkte ohne Eintrag (z. B. nur Shop, keine MV) → Fallback auf products-Tabelle.
 */
export async function getBuyboxWinners(
  client: SupabaseClient,
  productIds: string[]
): Promise<Map<string, BuyboxWinner | null>> {
  const result = new Map<string, BuyboxWinner | null>()
  if (productIds.length === 0) return result

  const uniq = [...new Set(productIds)]
  const { data: rows, error } = await client
    .from('mv_active_buybox_winners')
    .select('product_id, vendor_id, offer_id, seller_type, unit_price, shipping_price_eur, landed_price, fulfillment_type, stock')
    .in('product_id', uniq)

  if (error) {
    console.error('[getBuyboxWinners] mv_active_buybox_winners error:', error)
    return result
  }

  for (const r of rows ?? []) {
    result.set(r.product_id, {
      product_id: r.product_id,
      vendor_id: r.vendor_id ?? null,
      offer_id: r.offer_id ?? null,
      seller_type: (r.seller_type as 'shop' | 'vendor') ?? 'shop',
      unit_price: Number(r.unit_price ?? 0),
      shipping_price_eur: Number(r.shipping_price_eur ?? 0),
      landed_price: Number(r.landed_price ?? 0),
      fulfillment_type: (r.fulfillment_type as 'fbm' | 'fba') ?? 'fbm',
      stock: Number(r.stock ?? 0),
    })
  }

  return result
}
