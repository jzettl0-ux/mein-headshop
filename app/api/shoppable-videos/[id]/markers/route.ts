import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/**
 * GET /api/shoppable-videos/[id]/markers
 * Öffentlich: Produkt-Marker für ein freigegebenes Video.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const { id } = await params

  const admin = createSupabaseAdmin()
  const { data: video } = await admin
    .schema('catalog')
    .from('shoppable_videos')
    .select('id')
    .eq('id', id)
    .eq('status', 'approved')
    .single()

  if (!video) {
    return NextResponse.json({ error: 'Video nicht gefunden' }, { status: 404 })
  }

  const { data: markers, error } = await admin
    .schema('catalog')
    .from('shoppable_video_markers')
    .select('id, product_id, timestamp_seconds, label, products(id, name, slug, image_url)')
    .eq('video_id', id)
    .order('timestamp_seconds', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(markers ?? [])
}
