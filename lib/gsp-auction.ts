/**
 * Phase 9.3: GSP (Generalized Second Price) Auktionslogik
 * Blueprint: Ad Rank = Bid × Quality Score
 * CPC = minimal nötig, um Zweitplatzierten zu übertreffen + 0,01 €
 */

export interface GSPBidder {
  target_id: string
  max_bid_amount: number
  quality_score: number
}

export interface GSPRankedBidder extends GSPBidder {
  ad_rank: number
  position: number
  /** Geschätzter CPC (für Anzeige); tatsächlicher CPC erst bei Click. */
  estimated_cpc: number
}

/**
 * Berechnet Ad Rank = max_bid × quality_score
 */
export function computeAdRank(maxBid: number, qualityScore: number): number {
  return maxBid * Math.max(0.0001, qualityScore)
}

/**
 * Sortiert Bietende nach Ad Rank (absteigend) und weist Positionen zu.
 */
export function rankBidders(bidders: GSPBidder[]): GSPRankedBidder[] {
  const withRank = bidders.map((b) => ({
    ...b,
    ad_rank: computeAdRank(b.max_bid_amount, b.quality_score),
  }))
  withRank.sort((a, b) => b.ad_rank - a.ad_rank)

  return withRank.map((b, i) => {
    const nextAdRank = withRank[i + 1]?.ad_rank ?? 0
    const qs = Math.max(0.0001, b.quality_score)
    const minCpc = nextAdRank / qs + 0.01
    const estimatedCpc = Math.min(b.max_bid_amount, Math.max(0.01, minCpc))
    return {
      ...b,
      position: i + 1,
      estimated_cpc: Math.round(estimatedCpc * 100) / 100,
    }
  })
}

/**
 * Berechnet den tatsächlichen CPC für einen Click an Position `position`
 * in einer bereits gerankten Liste. CPC = (Ad Rank des Nächsten) / Quality Score + 0,01 €.
 */
export function computeChargedCpc(
  bidders: GSPBidder[],
  clickingTargetId: string
): { charged_cpc: number; capped: boolean } {
  const ranked = rankBidders(bidders)
  const clicker = ranked.find((b) => b.target_id === clickingTargetId)
  if (!clicker) return { charged_cpc: 0, capped: false }

  const nextBidder = ranked[clicker.position]
  const nextAdRank = nextBidder?.ad_rank ?? 0
  const qs = Math.max(0.0001, clicker.quality_score)
  const minCpc = nextAdRank / qs + 0.01
  const charged = Math.min(clicker.max_bid_amount, Math.max(0.01, minCpc))
  const capped = charged >= clicker.max_bid_amount

  return {
    charged_cpc: Math.round(charged * 100) / 100,
    capped,
  }
}
