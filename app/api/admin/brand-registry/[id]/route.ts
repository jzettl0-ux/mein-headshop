import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

/** PATCH – Marke bearbeiten */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body.slug === 'string' && body.slug.trim()) updates.slug = body.slug.trim()
  if (body.owner_type === 'vendor' || body.owner_type === 'shop') {
    updates.owner_type = body.owner_type
    updates.owner_id = body.owner_type === 'vendor' && body.owner_id ? body.owner_id : null
  }
  if (['pending', 'active', 'suspended'].includes(body.status)) updates.status = body.status
  if (typeof body.notes === 'string') updates.notes = body.notes.trim() || null

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_ops')
    .from('brand_registry')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE – Marke entfernen */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const id = resolved?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('advanced_ops').from('brand_registry').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
