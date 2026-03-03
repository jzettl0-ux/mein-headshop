import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Liste aller Live-Streams */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json([])

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('deep_tech')
    .from('live_streams')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Live-Stream anlegen */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const stream_title = typeof body.stream_title === 'string' ? body.stream_title.trim() : ''
  const hls_stream_url = typeof body.hls_stream_url === 'string' ? body.hls_stream_url.trim() || null : null
  const status = ['SCHEDULED', 'LIVE', 'ENDED', 'VOD'].includes(body.status) ? body.status : 'SCHEDULED'
  const vendor_id = body.vendor_id && typeof body.vendor_id === 'string' ? body.vendor_id.trim() || null : null

  if (!stream_title || stream_title.length < 2) {
    return NextResponse.json({ error: 'stream_title (min. 2 Zeichen) erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('deep_tech')
    .from('live_streams')
    .insert({
      vendor_id: vendor_id ?? null,
      stream_title,
      hls_stream_url,
      status,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
