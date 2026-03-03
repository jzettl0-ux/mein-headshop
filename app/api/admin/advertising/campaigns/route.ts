import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Liste aller Kampagnen */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { searchParams } = new URL(request.url)
  const vendorId = searchParams.get('vendor_id')

  const admin = createSupabaseAdmin()
  let q = admin
    .schema('advertising')
    .from('campaigns')
    .select('*')
    .order('created_at', { ascending: false })
  if (vendorId) q = q.eq('vendor_id', vendorId)
  const { data, error } = await q

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Kampagne anlegen */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const campaignName = typeof body.campaign_name === 'string' ? body.campaign_name.trim() : ''
  const dailyBudget = Number(body.daily_budget)
  if (!campaignName || campaignName.length < 2) {
    return NextResponse.json({ error: 'campaign_name (min. 2 Zeichen) erforderlich' }, { status: 400 })
  }
  if (isNaN(dailyBudget) || dailyBudget < 0) {
    return NextResponse.json({ error: 'daily_budget muss >= 0 sein' }, { status: 400 })
  }

  const vendorId = body.vendor_id && typeof body.vendor_id === 'string' ? body.vendor_id.trim() || null : null
  const biddingStrategy = ['FIXED_BIDS', 'DYNAMIC_DOWN_ONLY', 'DYNAMIC_UP_AND_DOWN'].includes(body.bidding_strategy)
    ? body.bidding_strategy
    : 'FIXED_BIDS'

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advertising')
    .from('campaigns')
    .insert({
      vendor_id: vendorId || null,
      campaign_name: campaignName,
      daily_budget: Math.round(dailyBudget * 100) / 100,
      bidding_strategy: biddingStrategy,
      status: 'ACTIVE',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
