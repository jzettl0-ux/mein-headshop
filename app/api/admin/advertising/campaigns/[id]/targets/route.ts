import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { checkKcanAdvertising } from '@/lib/kcan-advertising-check'

/** GET – Targets einer Kampagne */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id: campaignId } = await params
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advertising')
    .from('targets')
    .select('*, products(id, name, slug, image_url)')
    .eq('campaign_id', campaignId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Target hinzufügen */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id: campaignId } = await params
  const body = await request.json().catch(() => ({}))
  const targetType = ['KEYWORD', 'ASIN', 'PRODUCT'].includes(body.target_type) ? body.target_type : 'KEYWORD'
  const targetValue = typeof body.target_value === 'string' ? body.target_value.trim() : ''
  const maxBidAmount = Number(body.max_bid_amount)
  const matchType = ['EXACT', 'PHRASE', 'BROAD', 'AUTO'].includes(body.match_type) ? body.match_type : 'BROAD'
  const productId = body.product_id && typeof body.product_id === 'string' ? body.product_id.trim() || null : null

  if (!targetValue || targetValue.length < 1) {
    return NextResponse.json({ error: 'target_value erforderlich' }, { status: 400 })
  }

  const kcan = checkKcanAdvertising(targetValue)
  if (kcan.blocked) {
    return NextResponse.json({
      error: `KCanG §6: Target enthält verherrlichenden Begriff "${kcan.matchedTerm}". Bitte neutral formulieren.`,
    }, { status: 400 })
  }

  if (isNaN(maxBidAmount) || maxBidAmount < 0) {
    return NextResponse.json({ error: 'max_bid_amount muss >= 0 sein' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: campaign } = await admin
    .schema('advertising')
    .from('campaigns')
    .select('campaign_id')
    .eq('campaign_id', campaignId)
    .single()

  if (!campaign) {
    return NextResponse.json({ error: 'Kampagne nicht gefunden' }, { status: 404 })
  }

  const { data, error } = await admin
    .schema('advertising')
    .from('targets')
    .insert({
      campaign_id: campaignId,
      target_type: targetType,
      target_value: targetValue,
      product_id: productId,
      max_bid_amount: Math.round(maxBidAmount * 100) / 100,
      match_type: matchType,
    })
    .select('*, products(id, name, slug, image_url)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
