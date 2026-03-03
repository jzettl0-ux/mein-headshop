import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Einzelne Kampagne inkl. Targets */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const admin = createSupabaseAdmin()
  const { data: campaign, error } = await admin
    .schema('advertising')
    .from('campaigns')
    .select('*, vendor_accounts(id, company_name)')
    .eq('campaign_id', id)
    .single()

  if (error || !campaign) {
    return NextResponse.json({ error: 'Kampagne nicht gefunden' }, { status: 404 })
  }

  const { data: targets } = await admin
    .schema('advertising')
    .from('targets')
    .select('*, products(id, name, slug)')
    .eq('campaign_id', id)
    .order('created_at', { ascending: false })

  return NextResponse.json({ ...campaign, targets: targets ?? [] })
}

/** PATCH – Kampagne aktualisieren */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (typeof body.campaign_name === 'string' && body.campaign_name.trim().length >= 2) {
    updates.campaign_name = body.campaign_name.trim()
  }
  if (typeof body.daily_budget === 'number' && body.daily_budget >= 0) {
    updates.daily_budget = Math.round(body.daily_budget * 100) / 100
  }
  if (['FIXED_BIDS', 'DYNAMIC_DOWN_ONLY', 'DYNAMIC_UP_AND_DOWN'].includes(body.bidding_strategy)) {
    updates.bidding_strategy = body.bidding_strategy
  }
  if (['ACTIVE', 'PAUSED', 'ARCHIVED'].includes(body.status)) {
    updates.status = body.status
  }
  if (body.vendor_id !== undefined) {
    updates.vendor_id = body.vendor_id && typeof body.vendor_id === 'string' ? body.vendor_id.trim() || null : null
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advertising')
    .from('campaigns')
    .update(updates)
    .eq('campaign_id', id)
    .select('*, vendor_accounts(id, company_name)')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
