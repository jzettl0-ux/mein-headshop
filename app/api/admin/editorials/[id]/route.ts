/**
 * Blueprint TEIL 16: Einzelnes Editorial GET/PATCH/DELETE
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data: editorial, error: eErr } = await admin.schema('retail_media').from('editorials').select('*').eq('editorial_id', id).single()
  if (eErr || !editorial) return NextResponse.json({ error: 'Editorial nicht gefunden' }, { status: 404 })
  const { data: hotspots } = await admin.schema('retail_media').from('editorial_hotspots').select('*').eq('editorial_id', id)
  return NextResponse.json({ ...editorial, hotspots: hotspots ?? [] })
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (typeof body.hero_image_url === 'string' && body.hero_image_url.trim()) updates.hero_image_url = body.hero_image_url.trim().slice(0, 500)
  if (body.editorial_text !== undefined) updates.editorial_text = body.editorial_text?.trim() || null
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.schema('retail_media').from('editorials').update(updates).eq('editorial_id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('retail_media').from('editorials').delete().eq('editorial_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
