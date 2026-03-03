import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'
import { checkKcanAdvertising } from '@/lib/kcan-advertising-check'

/** PATCH – Shoppable Video aktualisieren / freigeben / ablehnen */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const body = await request.json().catch(() => ({}))
  const admin = createSupabaseAdmin()

  if (body.status === 'approved') {
    const title = (body.title as string)?.trim()
    const desc = (body.description as string)?.trim() ?? ''
    const kcanT = title ? checkKcanAdvertising(title) : { blocked: false }
    const kcanD = desc ? checkKcanAdvertising(desc) : { blocked: false }
    if (kcanT.blocked || kcanD.blocked) {
      return NextResponse.json({
        error: 'KCanG §6: Titel oder Beschreibung enthält verherrlichende Begriffe.',
        kcan_blocked: true,
      }, { status: 400 })
    }
    const { data, error } = await admin
      .schema('catalog')
      .from('shoppable_videos')
      .update({
        status: 'approved',
        rejection_reason: null,
        approved_at: new Date().toISOString(),
        approved_by: null,
        ...(title && { title }),
        ...(desc !== undefined && { description: desc || null }),
      })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  if (body.status === 'rejected') {
    const { data, error } = await admin
      .schema('catalog')
      .from('shoppable_videos')
      .update({ status: 'rejected', rejection_reason: body.rejection_reason ?? null })
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string') updates.title = body.title.trim()
  if (body.description !== undefined) updates.description = body.description ? String(body.description).trim() : null
  if (Object.keys(updates).length > 0) {
    const kcanT = updates.title ? checkKcanAdvertising(String(updates.title)) : { blocked: false }
    const kcanD = updates.description ? checkKcanAdvertising(String(updates.description)) : { blocked: false }
    if (kcanT.blocked || kcanD.blocked) {
      return NextResponse.json({ error: 'KCanG §6: Verherrlichende Begriffe nicht erlaubt.' }, { status: 400 })
    }
    const { data, error } = await admin
      .schema('catalog')
      .from('shoppable_videos')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data)
  }

  return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
}

/** DELETE – Shoppable Video löschen */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await params
  const admin = createSupabaseAdmin()
  const { data: row } = await admin.schema('catalog').from('shoppable_videos').select('storage_path').eq('id', id).single()
  if (row?.storage_path) {
    await admin.storage.from('shoppable-videos').remove([row.storage_path]).catch(() => {})
  }
  const { error } = await admin.schema('catalog').from('shoppable_videos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
