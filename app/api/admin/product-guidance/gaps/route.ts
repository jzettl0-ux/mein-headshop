/**
 * Search Term Gaps – Such-Lücken (hohes Volumen, wenige Treffer)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('analytics')
    .from('search_term_gaps')
    .select('*')
    .order('opportunity_score', { ascending: false })

  if (error) {
    if (error.code === '42P01') return NextResponse.json({ gaps: [] })
    console.error('[admin/product-guidance/gaps]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ gaps: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { search_term, search_volume_last_30_days } = body
  const term = String(search_term ?? '').trim().toLowerCase()
  if (!term) return NextResponse.json({ error: 'search_term erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: existing } = await admin
    .schema('analytics')
    .from('search_term_gaps')
    .select('gap_id, active_offers_count')
    .ilike('search_term', term)
    .maybeSingle()

  const volume = Math.max(0, parseInt(String(search_volume_last_30_days ?? 0), 10) || 0)

  let activeOffers = 0
  const { count } = await admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)
  activeOffers = count ?? 0

  if (existing) {
    const { data, error } = await admin
      .schema('analytics')
      .from('search_term_gaps')
      .update({
        search_volume_last_30_days: volume,
        active_offers_count: activeOffers,
        last_analyzed_at: new Date().toISOString(),
      })
      .eq('gap_id', (existing as { gap_id: string }).gap_id)
      .select()
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const { data, error } = await admin
    .schema('analytics')
    .from('search_term_gaps')
    .insert({
      search_term: term,
      search_volume_last_30_days: volume,
      active_offers_count: activeOffers,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
