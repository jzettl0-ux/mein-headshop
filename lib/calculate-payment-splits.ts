/**
 * Berechnet Mollie Split-Routing aus order_lines und order_items.
 * Phase 3.3: Zahlungsfluss für Multi-Vendor.
 * Phase 13.2: Commission Rules Engine – dynamische Provision pro Vendor.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { getCommissionForVendor, getDefaultCommission } from '@/lib/commission-rules'

export interface PaymentSplitRoute {
  vendor_id: string | null
  mollie_organization_id: string
  amount_eur: number
  commission_eur: number
  net_to_vendor_eur: number
}

export interface PaymentSplitsResult {
  routes: PaymentSplitRoute[]
  platform_amount_eur: number
  total_routed_eur: number
  canUseSplit: boolean
}

/**
 * Holt Order Lines und berechnet Split-Routing für Mollie.
 * Gibt leere routes zurück wenn keine Vendor-Lines mit mollie_org_id.
 */
export async function calculatePaymentSplits(
  admin: SupabaseClient,
  orderId: string
): Promise<PaymentSplitsResult> {
  const routes: PaymentSplitRoute[] = []
  let platform_amount_eur = 0
  let total_routed_eur = 0

  const { data: lines, error } = await admin
    .schema('fulfillment')
    .from('order_lines')
    .select('id, vendor_id, seller_type, subtotal')
    .eq('order_id', orderId)

  if (error || !lines?.length) {
    return { routes: [], platform_amount_eur: 0, total_routed_eur: 0, canUseSplit: false }
  }

  const vendorIds = [...new Set(lines.map((l) => l.vendor_id).filter(Boolean))] as string[]
  const { data: vendors } = vendorIds.length
    ? await admin.from('vendor_accounts').select('id, mollie_organization_id').in('id', vendorIds)
    : { data: [] }

  const vendorMollieMap = new Map(
    (vendors ?? []).map((v) => [v.id, (v as { mollie_organization_id?: string }).mollie_organization_id as string | undefined])
  )

  let hasVendorWithoutMollie = false
  for (const line of lines) {
    const subtotal = Number(line.subtotal ?? 0)
    if (subtotal <= 0) continue

    if (line.seller_type === 'shop' || !line.vendor_id) {
      platform_amount_eur += subtotal
      continue
    }

    const mollieOrgId = vendorMollieMap.get(line.vendor_id)
    if (!mollieOrgId?.trim()) {
      hasVendorWithoutMollie = true
      platform_amount_eur += subtotal
      continue
    }

    const rule = await getCommissionForVendor(admin, line.vendor_id, null)
    const { percentage: commissionPercent, fixedFee } = rule ?? getDefaultCommission()
    const lineCommission = Math.round((subtotal * commissionPercent / 100) * 100) / 100

    const existing = routes.find((r) => r.vendor_id === line.vendor_id)
    const commissionThisLine = existing ? lineCommission : lineCommission + (fixedFee || 0)
    const netThisLine = Math.round((subtotal - commissionThisLine) * 100) / 100

    if (existing) {
      existing.amount_eur += subtotal
      existing.commission_eur += lineCommission
      existing.net_to_vendor_eur += netThisLine
    } else {
      routes.push({
        vendor_id: line.vendor_id,
        mollie_organization_id: mollieOrgId,
        amount_eur: subtotal,
        commission_eur: commissionThisLine,
        net_to_vendor_eur: netThisLine,
      })
    }
    total_routed_eur += netThisLine
    platform_amount_eur += commissionThisLine
  }

  const canUseSplit = routes.length > 0 && !hasVendorWithoutMollie
  return {
    routes: routes
      .map((r) => ({
        ...r,
        amount_eur: Math.round(r.amount_eur * 100) / 100,
        commission_eur: Math.round(r.commission_eur * 100) / 100,
        net_to_vendor_eur: Math.round(r.net_to_vendor_eur * 100) / 100,
      }))
      .filter((r) => r.net_to_vendor_eur > 0),
    platform_amount_eur: Math.round(platform_amount_eur * 100) / 100,
    total_routed_eur: Math.round(total_routed_eur * 100) / 100,
    canUseSplit,
  }
}
