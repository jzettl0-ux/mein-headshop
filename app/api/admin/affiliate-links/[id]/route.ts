import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** PATCH /api/admin/affiliate-links/[id] – Affiliate-Link bearbeiten */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.partner_name === 'string' && body.partner_name.trim()) updates.partner_name = body.partner_name.trim()
  if (typeof body.partner_email === 'string') updates.partner_email = body.partner_email.trim() || null
  if (typeof body.commission_percent === 'number' && body.commission_percent >= 0 && body.commission_percent <= 100) updates.commission_percent = body.commission_percent
  if (typeof body.cookie_days === 'number' && body.cookie_days >= 1 && body.cookie_days <= 365) updates.cookie_days = body.cookie_days
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active

  if (Object.keys(updates).length <= 1) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_ops')
    .from('affiliate_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE /api/admin/affiliate-links/[id] – Affiliate-Link entfernen */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('advanced_ops').from('affiliate_links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
