/**
 * Blueprint TEIL 21.8: Intentions-Hubs (Navigation Hubs)
 * GET: Liste | POST: Neuer Hub
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('visual_merchandising')
    .from('navigation_hubs')
    .select('*')
    .order('sort_order', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const hubName = String(body.hub_name ?? '').trim()
  const slugUrl = String(body.slug_url ?? '').trim().toLowerCase().replace(/\s+/g, '-')
  if (!hubName) return NextResponse.json({ error: 'hub_name fehlt' }, { status: 400 })
  if (!slugUrl) return NextResponse.json({ error: 'slug_url fehlt' }, { status: 400 })
  const layout = ['BENTO_GRID', 'EDITORIAL_FEED', 'PRODUCT_LIST', 'COUNTDOWN_VAULT'].includes(body.ui_layout_type)
    ? body.ui_layout_type
    : 'PRODUCT_LIST'
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('visual_merchandising')
    .from('navigation_hubs')
    .insert({
      hub_name: hubName,
      ui_layout_type: layout,
      slug_url: slugUrl,
      is_active: body.is_active !== false,
      sort_order: Math.floor(Number(body.sort_order) ?? 0),
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
