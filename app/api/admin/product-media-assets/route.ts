/**
 * Blueprint TEIL 21.9/10: Product Media Assets (nur wenn catalog ASIN existiert)
 * GET: Liste (optional ?asin=) | POST: Neuer Eintrag (HERO_IMAGE_1600PX braucht resolution >= 1600)
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const MEDIA_TYPES = ['HERO_IMAGE_1600PX', 'HOVER_PREVIEW_VIDEO', '360_SPIN_FRAME', 'LIFESTYLE_IMAGE'] as const

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const { searchParams } = new URL(request.url)
  const asin = searchParams.get('asin')
  const admin = createSupabaseAdmin()
  let q = admin.schema('visual_merchandising').from('product_media_assets').select('*').order('asin').order('frame_sequence_number')
  if (asin) q = q.eq('asin', asin)
  const { data, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const asin = String(body.asin ?? '').trim().slice(0, 15)
  const mediaType = MEDIA_TYPES.includes(body.media_type) ? body.media_type : 'LIFESTYLE_IMAGE'
  const fileUrl = String(body.file_url ?? '').trim()
  if (!asin || !fileUrl) return NextResponse.json({ error: 'asin und file_url erforderlich' }, { status: 400 })
  const width = body.resolution_width != null ? Math.max(0, Math.floor(Number(body.resolution_width))) : null
  const height = body.resolution_height != null ? Math.max(0, Math.floor(Number(body.resolution_height))) : null
  if (mediaType === 'HERO_IMAGE_1600PX' && (width == null || height == null || width < 1600 || height < 1600))
    return NextResponse.json({ error: 'HERO_IMAGE_1600PX erfordert resolution_width und resolution_height >= 1600' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('visual_merchandising')
    .from('product_media_assets')
    .insert({
      asin,
      media_type: mediaType,
      file_url: fileUrl.slice(0, 500),
      resolution_width: width,
      resolution_height: height,
      frame_sequence_number: Math.max(0, Math.floor(Number(body.frame_sequence_number) ?? 0)),
      alt_text: body.alt_text?.trim()?.slice(0, 255) || null,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
