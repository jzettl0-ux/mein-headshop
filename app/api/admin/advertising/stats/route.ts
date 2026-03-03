import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * GET /api/admin/advertising/stats?campaign_id=...&from=...&to=...
 * Aggregierte Ad-Event-Statistiken (Impressions, Clicks, CPC, Conversions).
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const campaignId = searchParams.get('campaign_id')
  const from = searchParams.get('from')
  const to = searchParams.get('to')

  const admin = createSupabaseAdmin()

  let eventsQuery = admin
    .schema('advertising')
    .from('ad_events')
    .select('target_id, event_type, charged_cpc, created_at')

  if (from) {
    eventsQuery = eventsQuery.gte('created_at', from)
  }
  if (to) {
    eventsQuery = eventsQuery.lte('created_at', to)
  }

  const { data: events, error } = await eventsQuery

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const targetIds = [...new Set((events ?? []).map((e: any) => e.target_id))]
  if (targetIds.length === 0) {
    return NextResponse.json({ impressions: 0, clicks: 0, conversions: 0, spend: 0, by_target: [] })
  }

  const { data: targets } = await admin
    .schema('advertising')
    .from('targets')
    .select('target_id, campaign_id, target_value, target_type')
    .in('target_id', targetIds)

  let filteredTargets = targets ?? []
  if (campaignId) {
    filteredTargets = filteredTargets.filter((t: any) => t.campaign_id === campaignId)
    const ftIds = new Set(filteredTargets.map((t: any) => t.target_id))
    filteredTargets = filteredTargets.filter((t: any) => ftIds.has(t.target_id))
  }

  const targetIdSet = new Set(filteredTargets.map((t: any) => t.target_id))
  const relevantEvents = (events ?? []).filter((e: any) => targetIdSet.has(e.target_id))

  let impressions = 0
  let clicks = 0
  let conversions = 0
  let spend = 0
  const byTarget: Record<string, { impressions: number; clicks: number; conversions: number; spend: number }> = {}

  for (const e of relevantEvents) {
    const tid = e.target_id
    if (!byTarget[tid]) byTarget[tid] = { impressions: 0, clicks: 0, conversions: 0, spend: 0 }
    if (e.event_type === 'IMPRESSION') {
      impressions++
      byTarget[tid].impressions++
    } else if (e.event_type === 'CLICK') {
      clicks++
      byTarget[tid].clicks++
      const cpc = Number(e.charged_cpc) ?? 0
      spend += cpc
      byTarget[tid].spend += cpc
    } else if (e.event_type === 'CONVERSION') {
      conversions++
      byTarget[tid].conversions++
    }
  }

  const byTargetList = filteredTargets.map((t: any) => ({
    target_id: t.target_id,
    target_value: t.target_value,
    target_type: t.target_type,
    ...byTarget[t.target_id],
  }))

  return NextResponse.json({
    impressions,
    clicks,
    conversions,
    spend: Math.round(spend * 100) / 100,
    by_target: byTargetList,
  })
}
