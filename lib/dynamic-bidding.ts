/**
 * Phase 9.4: Dynamic Bidding (Blueprint)
 * Down Only: Nur senken bei geringer Conversion-Wahrscheinlichkeit
 * Up and Down: Senken oder erhöhen je nach Konversion
 */

export type BiddingStrategy =
  | 'FIXED_BIDS'
  | 'DYNAMIC_DOWN_ONLY'
  | 'DYNAMIC_UP_AND_DOWN'

export interface DynamicBiddingContext {
  /** Quality Score (0–10 typisch, hier 0.0001–10) – Proxy für CTR/CVR */
  quality_score: number
  /** Optionale Conversion-Rate aus Historie (0–1), falls bekannt */
  conversion_rate?: number
  /** Platzierung: "top" = oben, "rest" = Rest der Suche */
  placement?: 'top' | 'rest'
  /** Geschätzte Position (1 = erstes Ergebnis); vor Ranking unbekannt, optional */
  estimated_position?: number
}

/**
 * Berechnet den effektiven Gebotswert aus max_bid + Strategie + Kontext.
 * Für GSP-Auktion: Der effektive Bid ersetzt max_bid_amount beim Ranking.
 */
export function computeEffectiveBid(
  maxBid: number,
  strategy: BiddingStrategy,
  context: DynamicBiddingContext
): number {
  if (strategy === 'FIXED_BIDS') {
    return maxBid
  }

  const qs = Math.max(0.0001, Math.min(10, context.quality_score))
  const cvr = context.conversion_rate ?? qs / 10 // Fallback: QS als CVR-Proxy

  if (strategy === 'DYNAMIC_DOWN_ONLY') {
    // Nur senken: Multiplikator 0.3–1.0, je nach Conversion-Wahrscheinlichkeit
    // Niedriger QS/CVR → niedrigerer Bid
    const multiplier = 0.3 + 0.7 * cvr
    const placementFactor = context.placement === 'rest' ? 0.85 : 1
    const effective = maxBid * Math.min(1, multiplier * placementFactor)
    return Math.round(effective * 100) / 100
  }

  if (strategy === 'DYNAMIC_UP_AND_DOWN') {
    // Up and Down: Multiplikator 0.5–1.5
    const multiplier = 0.5 + cvr // 0.5 bei CVR=0, 1.5 bei CVR=1
    const clamped = Math.max(0.5, Math.min(1.5, multiplier))
    const placementFactor = context.placement === 'top' ? 1.1 : context.placement === 'rest' ? 0.9 : 1
    const effective = maxBid * clamped * placementFactor
    return Math.round(Math.max(0.01, effective) * 100) / 100
  }

  return maxBid
}
