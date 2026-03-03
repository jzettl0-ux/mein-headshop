/**
 * POST – Zählt aktive Angebote für diesen Suchbegriff
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  const admin = createSupabaseAdmin()

  const { data: gap } = await admin
    .schema('analytics')
    .from('search_term_gaps')
    .select('search_term')
    .eq('gap_id', id)
    .single()

  if (!gap) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })

  const term = (gap as { search_term: string }).search_term
  const { count } = await admin
    .from('products')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .or(`name.ilike.%${term}%,description.ilike.%${term}%`)

  const activeOffers = count ?? 0

  const { data, error } = await admin
    .schema('analytics')
    .from('search_term_gaps')
    .update({
      active_offers_count: activeOffers,
      last_analyzed_at: new Date().toISOString(),
    })
    .eq('gap_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
