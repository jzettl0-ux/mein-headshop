/**
 * Phase 13.2: Commission Rules Engine
 * Ermittelt die anzuwendende Provision für Vendor/Kategorie.
 * Niedrigere priority = höhere Priorität.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

const DEFAULT_COMMISSION_PERCENT = 15

export interface CommissionRuleRow {
  id: string
  vendor_id: string | null
  category_id: string | null
  percentage_fee: number
  fixed_fee: number
  priority: number
}

/**
 * Holt die beste passende Commission Rule für einen Vendor.
 * Reihenfolge: vendor+category > vendor > category > global (niedrigste priority).
 * Gibt null zurück wenn keine Regel passt (dann Default nutzen).
 */
export async function getCommissionForVendor(
  admin: SupabaseClient,
  vendorId: string,
  categoryId?: string | null
): Promise<{ percentage: number; fixedFee: number } | null> {
  const { data: rules, error } = await admin
    .from('commission_rules')
    .select('vendor_id, category_id, percentage_fee, fixed_fee, priority')
    .eq('is_active', true)
    .or(`vendor_id.eq.${vendorId},vendor_id.is.null`)
    .order('priority', { ascending: true })

  if (error || !rules?.length) return null

  const asRows = (rules ?? []) as CommissionRuleRow[]

  // Spezifischste Regel: vendor + category
  if (categoryId) {
    const vc = asRows.find((r) => r.vendor_id === vendorId && r.category_id === categoryId)
    if (vc) return { percentage: Number(vc.percentage_fee), fixedFee: Number(vc.fixed_fee ?? 0) }
  }

  // Nur vendor
  const v = asRows.find((r) => r.vendor_id === vendorId && !r.category_id)
  if (v) return { percentage: Number(v.percentage_fee), fixedFee: Number(v.fixed_fee ?? 0) }

  // Global (vendor_id null)
  const g = asRows.find((r) => !r.vendor_id)
  if (g) return { percentage: Number(g.percentage_fee), fixedFee: Number(g.fixed_fee ?? 0) }

  return null
}

export function getDefaultCommission(): { percentage: number; fixedFee: number } {
  return { percentage: DEFAULT_COMMISSION_PERCENT, fixedFee: 0 }
}
