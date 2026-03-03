/**
 * Phase 10.4: B2B Staffelpreise
 * Berechnet den besten Einheitspreis bei gegebener Menge.
 */

export interface TieredPriceRow {
  min_quantity: number
  unit_price: number
}

/**
 * Findet den besten Staffelpreis für eine Menge.
 * Stufen sind absteigend nach min_quantity sortiert – höchste passende Stufe gewinnt.
 */
export function getTieredUnitPrice(
  basePrice: number,
  quantity: number,
  tiers: TieredPriceRow[]
): number {
  if (!tiers?.length || quantity < 1) return basePrice

  const sorted = [...tiers].sort((a, b) => b.min_quantity - a.min_quantity)
  const best = sorted.find((t) => quantity >= t.min_quantity)
  return best ? Number(best.unit_price) : basePrice
}
