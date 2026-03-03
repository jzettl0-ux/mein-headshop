/**
 * Blueprint TEIL 21.12: Quick View Config (asin PK, nur wenn catalog ASIN existiert)
 * GET: Liste | POST: Upsert (asin, allow_quick_view, force_redirect_to_pdp)
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
    .from('quick_view_config')
    .select('*')
    .order('asin')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const asin = String(body.asin ?? '').trim().slice(0, 15)
  if (!asin) return NextResponse.json({ error: 'asin fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('visual_merchandising')
    .from('quick_view_config')
    .upsert(
      {
        asin,
        allow_quick_view: body.allow_quick_view !== false,
        force_redirect_to_pdp: body.force_redirect_to_pdp === true,
      },
      { onConflict: 'asin' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
