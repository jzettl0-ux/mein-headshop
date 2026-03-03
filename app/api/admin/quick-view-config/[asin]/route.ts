/**
 * Blueprint TEIL 21.12: Quick View Config PATCH/DELETE by asin
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ asin: string }> | { asin: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const asin = decodeURIComponent((await Promise.resolve(context.params).then((p) => p ?? {})).asin ?? '')
  if (!asin) return NextResponse.json({ error: 'asin fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.allow_quick_view === 'boolean') updates.allow_quick_view = body.allow_quick_view
  if (typeof body.force_redirect_to_pdp === 'boolean') updates.force_redirect_to_pdp = body.force_redirect_to_pdp
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.schema('visual_merchandising').from('quick_view_config').update(updates).eq('asin', asin).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ asin: string }> | { asin: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const asin = decodeURIComponent((await Promise.resolve(context.params).then((p) => p ?? {})).asin ?? '')
  if (!asin) return NextResponse.json({ error: 'asin fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('visual_merchandising').from('quick_view_config').delete().eq('asin', asin)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
