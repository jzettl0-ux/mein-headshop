/**
 * Repricer: Automatisierte Preisanpassung basierend auf Buy Box / niedrigstem Preis
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export interface RepricerResult {
  updated: number
  skipped: number
  errors: string[]
}

/** Führt Repricing für alle aktiven Regeln aus */
export async function runRepricer(admin?: SupabaseClient): Promise<RepricerResult> {
  const { createSupabaseAdmin, hasSupabaseAdmin } = await import('@/lib/supabase-admin')
  const client = admin ?? (hasSupabaseAdmin() ? createSupabaseAdmin() : null)
  if (!client) return { updated: 0, skipped: 0, errors: ['Service nicht verfügbar'] }

  const result: RepricerResult = { updated: 0, skipped: 0, errors: [] }

  const { data: rules, error: rulesErr } = await client
    .schema('pricing')
    .from('automated_rules')
    .select('rule_id, offer_id, vendor_id, min_price, max_price, rule_type, price_offset')
    .eq('is_active', true)

  if (rulesErr || !rules?.length) return result

  for (const rule of rules as {
    rule_id: string
    offer_id: string
    vendor_id: string
    min_price: number
    max_price: number
    rule_type: string
    price_offset: number
  }[]) {
    try {
      const { data: offer } = await client
        .from('vendor_offers')
        .select('product_id, unit_price, shipping_price_eur')
        .eq('id', rule.offer_id)
        .single()

      if (!offer) {
        result.skipped++
        continue
      }

      const productId = (offer as { product_id: string }).product_id

      const { data: comps } = await client
        .from('vendor_offers')
        .select('unit_price, shipping_price_eur')
        .eq('product_id', productId)
        .neq('vendor_id', rule.vendor_id)
        .eq('is_active', true)

      const competitors = (comps ?? []).map((c: { unit_price: number; shipping_price_eur: number }) => ({
        landed: Number(c.unit_price ?? 0) + Number(c.shipping_price_eur ?? 0),
        ...c,
      })).sort((a: { landed: number }, b: { landed: number }) => a.landed - b.landed)

      const ourShipping = Number((offer as { shipping_price_eur: number }).shipping_price_eur ?? 0)
      let targetLanded: number | null = null
      if (rule.rule_type === 'MATCH_LOWEST_PRICE' || rule.rule_type === 'MATCH_BUY_BOX' || rule.rule_type === 'STAY_BELOW_BUY_BOX') {
        const lowest = competitors[0]
        const lowestLanded = lowest ? (lowest as { landed: number }).landed : null
        if (lowestLanded != null) {
          if (rule.rule_type === 'STAY_BELOW_BUY_BOX') {
            targetLanded = lowestLanded - 0.01 + (rule.price_offset || 0)
          } else {
            targetLanded = lowestLanded + (rule.price_offset || 0)
          }
        }
      }

      if (targetLanded == null) {
        result.skipped++
        continue
      }

      const targetLandedClamped = Math.min(rule.max_price, Math.max(rule.min_price, targetLanded))
      const newUnitPrice = Math.max(0, Math.round((targetLandedClamped - ourShipping) * 100) / 100)

      const currentUnit = Number((offer as { unit_price: number }).unit_price ?? 0)
      if (Math.abs(newUnitPrice - currentUnit) < 0.005) {
        result.skipped++
        continue
      }

      const { error: updErr } = await client
        .from('vendor_offers')
        .update({
          unit_price: newUnitPrice,
          updated_at: new Date().toISOString(),
        })
        .eq('id', rule.offer_id)

      if (updErr) {
        result.errors.push(`${rule.offer_id}: ${updErr.message}`)
        continue
      }

      await client
        .schema('pricing')
        .from('automated_rules')
        .update({ updated_at: new Date().toISOString() })
        .eq('rule_id', rule.rule_id)

      result.updated++
    } catch (e) {
      result.errors.push(`${rule.offer_id}: ${(e as Error).message}`)
    }
  }

  return result
}
