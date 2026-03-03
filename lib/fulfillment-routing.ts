/**
 * FBA vs. FBM Routing (Phase 3.4).
 * Ermittelt, wer welche Order Lines versendet.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type ShipmentResponsibility = 'shop' | 'vendor' | 'fba_warehouse'

export interface FulfillmentRoute {
  order_line_id: string
  vendor_id: string | null
  seller_type: 'shop' | 'vendor'
  fulfillment_type: 'fbm' | 'fba'
  subtotal: number
  /** Wer versendet: Shop (eigen), Vendor (Dropship), FBA (Zentrallager) */
  shipped_by: ShipmentResponsibility
  /** Für Admin: Anzeige "Versand durch" */
  shipped_by_label: string
}

export interface FulfillmentRoutesResult {
  routes: FulfillmentRoute[]
  shopFulfilledCount: number
  vendorFulfilledCount: number
  fbaCount: number
}

/**
 * Holt Order Lines und klassifiziert nach FBA/FBM.
 * - FBM + shop: Shop versendet (DHL Label)
 * - FBM + vendor: Vendor versendet (Dropship-Benachrichtigung)
 * - FBA: Zentrallager (FBA; später)
 */
export async function getFulfillmentRoutes(
  client: SupabaseClient,
  orderId: string
): Promise<FulfillmentRoutesResult> {
  const { data: lines, error } = await client
    .schema('fulfillment')
    .from('order_lines')
    .select('id, vendor_id, seller_type, fulfillment_type, subtotal')
    .eq('order_id', orderId)
    .order('id', { ascending: true })

  if (error || !lines?.length) {
    return { routes: [], shopFulfilledCount: 0, vendorFulfilledCount: 0, fbaCount: 0 }
  }

  const routes: FulfillmentRoute[] = []
  let shopFulfilledCount = 0
  let vendorFulfilledCount = 0
  let fbaCount = 0

  for (const line of lines) {
    const sellerType = (line.seller_type as 'shop' | 'vendor') ?? 'shop'
    const fulfillmentType = (line.fulfillment_type as 'fbm' | 'fba') ?? 'fbm'
    const subtotal = Number(line.subtotal ?? 0)

    let shipped_by: ShipmentResponsibility
    let shipped_by_label: string

    if (fulfillmentType === 'fba') {
      shipped_by = 'fba_warehouse'
      shipped_by_label = 'FBA Zentrallager'
      fbaCount++
    } else if (sellerType === 'shop') {
      shipped_by = 'shop'
      shipped_by_label = 'Shop (DHL)'
      shopFulfilledCount++
    } else {
      shipped_by = 'vendor'
      shipped_by_label = 'Vendor (Dropship)'
      vendorFulfilledCount++
    }

    routes.push({
      order_line_id: line.id,
      vendor_id: line.vendor_id ?? null,
      seller_type: sellerType,
      fulfillment_type: fulfillmentType,
      subtotal,
      shipped_by,
      shipped_by_label,
    })
  }

  return {
    routes,
    shopFulfilledCount,
    vendorFulfilledCount,
    fbaCount,
  }
}
