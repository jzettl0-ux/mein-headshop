import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const BUCKET = 'influencer-assets'

/** PATCH – Asset aktualisieren (Titel, Kategorie, Sichtbarkeit, format_info) */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
  if (['product_photos', 'banner', 'logos'].includes(body.category)) updates.category = body.category
  if (['public', 'partner_only'].includes(body.visibility)) updates.visibility = body.visibility
  if (body.format_info !== undefined) updates.format_info = body.format_info ? String(body.format_info).trim() : null

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine gültigen Felder zum Aktualisieren' }, { status: 400 })
  }

  updates.updated_at = new Date().toISOString()

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('influencer_assets')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ asset: data })
}

/** DELETE – Asset löschen (DB + Storage) */
export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: row, error: fetchErr } = await admin
    .from('influencer_assets')
    .select('storage_path')
    .eq('id', id)
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Asset nicht gefunden' }, { status: 404 })
  }

  await admin.storage.from(BUCKET).remove([row.storage_path]).catch(() => {})

  const { error: deleteErr } = await admin.from('influencer_assets').delete().eq('id', id)

  if (deleteErr) return NextResponse.json({ error: deleteErr.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
