/**
 * Blueprint TEIL 21.9/10: Product Media Asset PATCH/DELETE
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

const MEDIA_TYPES = ['HERO_IMAGE_1600PX', 'HOVER_PREVIEW_VIDEO', '360_SPIN_FRAME', 'LIFESTYLE_IMAGE'] as const

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.file_url === 'string' && body.file_url.trim()) updates.file_url = body.file_url.trim().slice(0, 500)
  if (MEDIA_TYPES.includes(body.media_type)) updates.media_type = body.media_type
  if (body.resolution_width != null) updates.resolution_width = Math.max(0, Math.floor(Number(body.resolution_width)))
  if (body.resolution_height != null) updates.resolution_height = Math.max(0, Math.floor(Number(body.resolution_height)))
  if (body.frame_sequence_number != null) updates.frame_sequence_number = Math.max(0, Math.floor(Number(body.frame_sequence_number)))
  if (body.alt_text !== undefined) updates.alt_text = body.alt_text?.trim()?.slice(0, 255) || null
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.schema('visual_merchandising').from('product_media_assets').update(updates).eq('media_id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('visual_merchandising').from('product_media_assets').delete().eq('media_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
