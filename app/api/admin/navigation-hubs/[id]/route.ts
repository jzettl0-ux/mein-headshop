/**
 * Blueprint TEIL 21.8: PATCH/DELETE einzelner Navigation Hub
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

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
  if (typeof body.hub_name === 'string' && body.hub_name.trim()) updates.hub_name = body.hub_name.trim()
  if (['BENTO_GRID', 'EDITORIAL_FEED', 'PRODUCT_LIST', 'COUNTDOWN_VAULT'].includes(body.ui_layout_type)) updates.ui_layout_type = body.ui_layout_type
  if (typeof body.slug_url === 'string' && body.slug_url.trim()) updates.slug_url = body.slug_url.trim().toLowerCase().replace(/\s+/g, '-')
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (typeof body.sort_order === 'number' || (typeof body.sort_order === 'string' && body.sort_order !== '')) updates.sort_order = Math.floor(Number(body.sort_order) ?? 0)
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('visual_merchandising')
    .from('navigation_hubs')
    .update(updates)
    .eq('hub_id', id)
    .select()
    .single()
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
  const { error } = await admin.schema('visual_merchandising').from('navigation_hubs').delete().eq('hub_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
