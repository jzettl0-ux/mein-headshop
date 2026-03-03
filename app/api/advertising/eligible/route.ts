import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { rankBidders } from '@/lib/gsp-auction'
import { computeEffectiveBid, type BiddingStrategy } from '@/lib/dynamic-bidding'

/**
 * GET /api/advertising/eligible?product_id=...&search=...&placement=top|rest
 * Liefert passende Targets für einen Kontext. Sortiert nach GSP Ad Rank.
 * Phase 9.4: Dynamic Bidding (Down Only / Up and Down) wird berücksichtigt.
 */
export async function GET(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { searchParams } = new URL(request.url)
  const placement = (searchParams.get('placement') === 'top' ? 'top' : searchParams.get('placement') === 'rest' ? 'rest' : undefined) as 'top' | 'rest' | undefined

  const { data: activeCampaigns } = await admin
    .schema('advertising')
    .from('campaigns')
    .select('campaign_id, bidding_strategy')
    .eq('status', 'ACTIVE')

  const campaignIds = (activeCampaigns ?? []).map((c: { campaign_id: string }) => c.campaign_id)
  const strategyMap = new Map<string, BiddingStrategy>(
    (activeCampaigns ?? []).map((c: { campaign_id: string; bidding_strategy: string }) => [
      c.campaign_id,
      ['FIXED_BIDS', 'DYNAMIC_DOWN_ONLY', 'DYNAMIC_UP_AND_DOWN'].includes(c.bidding_strategy)
        ? (c.bidding_strategy as BiddingStrategy)
        : 'FIXED_BIDS',
    ])
  )

  if (campaignIds.length === 0) {
    return NextResponse.json({ ads: [] })
  }

  const { data: targets, error } = await admin
    .schema('advertising')
    .from('targets')
    .select('target_id, target_type, target_value, product_id, max_bid_amount, quality_score, campaign_id')
    .in('campaign_id', campaignIds)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (!targets?.length) {
    return NextResponse.json({ ads: [] })
  }

  const bidders = targets
    .map((t: any) => {
      const maxBid = Number(t.max_bid_amount) ?? 0
      if (maxBid <= 0) return null
      const strategy = strategyMap.get(t.campaign_id) ?? 'FIXED_BIDS'
      const qualityScore = Number(t.quality_score) ?? 1
      const effectiveBid = computeEffectiveBid(maxBid, strategy, {
        quality_score: qualityScore,
        placement,
      })
      return {
        target_id: t.target_id,
        max_bid_amount: effectiveBid,
        quality_score: qualityScore,
      }
    })
    .filter((b) => b !== null) as { target_id: string; max_bid_amount: number; quality_score: number }[]

  const ranked = rankBidders(bidders)
  const targetMap = new Map(targets.map((t: any) => [t.target_id, t]))

  const ads = ranked.slice(0, 10).map((r) => {
    const t = targetMap.get(r.target_id)
    return {
      target_id: r.target_id,
      target_type: t?.target_type,
      target_value: t?.target_value,
      product_id: t?.product_id,
      position: r.position,
      estimated_cpc: r.estimated_cpc,
      ad_rank: r.ad_rank,
    }
  })

  return NextResponse.json({ ads })
}
