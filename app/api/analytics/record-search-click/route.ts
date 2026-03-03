/**
 * POST /api/analytics/record-search-click
 * Click Share: Speichert einen Klick auf ein Suchergebnis (search_term + product_id).
 * Öffentlich aufrufbar (z. B. vom Shop-Frontend beim Klick auf Produkt in der Suchautocomplete).
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ ok: false }, { status: 503 })
  }

  let body: { search_term?: string; product_id?: string; session_id?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  const search_term = typeof body.search_term === 'string' ? body.search_term.trim().slice(0, 255) : ''
  const product_id = typeof body.product_id === 'string' ? body.product_id.trim() : ''
  const session_id = typeof body.session_id === 'string' ? body.session_id.trim().slice(0, 255) : ''

  if (!search_term || !product_id) {
    return NextResponse.json({ ok: false, error: 'search_term und product_id erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { error } = await admin
    .schema('advanced_analytics')
    .from('search_clicks')
    .insert({
      search_term,
      product_id,
      session_id: session_id || `anon-${request.headers.get('x-forwarded-for') || 'unknown'}`,
    })

  if (error) {
    console.error('[record-search-click]', error.message)
    return NextResponse.json({ ok: false }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
