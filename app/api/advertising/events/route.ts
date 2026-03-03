import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { computeChargedCpc } from '@/lib/gsp-auction'
import { computeEffectiveBid, type BiddingStrategy } from '@/lib/dynamic-bidding'

/**
 * POST /api/advertising/events
 * Erfasst Ad-Events: IMPRESSION (0 €) oder CLICK (CPC nach GSP).
 * Body: { target_id, product_id?, event_type: 'IMPRESSION'|'CLICK', session_id?, placement?: 'top'|'rest' }
 * Phase 9.4: Dynamic Bidding wird bei CPC-Berechnung berücksichtigt.
 */
export async function POST(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({}))
  const targetId = body.target_id
  const productId = body.product_id || null
  const eventType = body.event_type === 'CLICK' ? 'CLICK' : 'IMPRESSION'
  const sessionId = typeof body.session_id === 'string' ? body.session_id.slice(0, 255) : null
  const placement = body.placement === 'top' ? 'top' : body.placement === 'rest' ? 'rest' : undefined

  if (!targetId || typeof targetId !== 'string') {
    return NextResponse.json({ error: 'target_id erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  const { data: target } = await admin
    .schema('advertising')
    .from('targets')
    .select('target_id, campaign_id, max_bid_amount, quality_score')
    .eq('target_id', targetId)
    .single()

  if (!target) {
    return NextResponse.json({ error: 'Target nicht gefunden' }, { status: 404 })
  }

  let chargedCpc = 0

  if (eventType === 'CLICK') {
    const { data: campaign } = await admin
      .schema('advertising')
      .from('campaigns')
      .select('bidding_strategy')
      .eq('campaign_id', target.campaign_id)
      .single()

    const strat = campaign?.bidding_strategy ?? 'FIXED_BIDS'
    const strategy: BiddingStrategy = ['FIXED_BIDS', 'DYNAMIC_DOWN_ONLY', 'DYNAMIC_UP_AND_DOWN'].includes(strat)
      ? (strat as BiddingStrategy)
      : 'FIXED_BIDS'

    const { data: competitors } = await admin
      .schema('advertising')
      .from('targets')
      .select('target_id, max_bid_amount, quality_score')
      .eq('campaign_id', target.campaign_id)

    const bidders = (competitors ?? []).map((c: any) => {
      const maxBid = Number(c.max_bid_amount) ?? 0
      const qs = Number(c.quality_score) ?? 1
      const effective = computeEffectiveBid(maxBid, strategy, { quality_score: qs, placement })
      return {
        target_id: c.target_id,
        max_bid_amount: effective,
        quality_score: qs,
      }
    })

    const { charged_cpc } = computeChargedCpc(bidders, targetId)
    chargedCpc = charged_cpc
  }

  const { data: event, error } = await admin
    .schema('advertising')
    .from('ad_events')
    .insert({
      target_id: targetId,
      product_id: productId,
      event_type: eventType,
      charged_cpc: chargedCpc,
      session_id: sessionId,
    })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    event_id: event.event_id,
    event_type: eventType,
    charged_cpc: chargedCpc,
  })
}
