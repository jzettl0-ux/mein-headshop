import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getConnectorTypes } from '@/lib/connectors'

export const dynamic = 'force-dynamic'

/**
 * GET – Eine Integration laden.
 */
export async function GET(
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
  const { data, error } = await admin.from('integrations').select('*, suppliers(id, name)').eq('id', id).single()
  if (error || !data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

/**
 * PATCH – Integration aktualisieren.
 */
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
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (typeof body.name === 'string' && body.name.trim()) updates.name = body.name.trim()
  if (typeof body.connector_type === 'string') {
    const types = getConnectorTypes()
    if (types.some((t) => t.value === body.connector_type)) updates.connector_type = body.connector_type
  }
  if (typeof body.api_endpoint === 'string') updates.api_endpoint = body.api_endpoint.trim()
  if (body.api_key !== undefined) updates.api_key = typeof body.api_key === 'string' ? body.api_key.trim() || null : null
  if (typeof body.sync_interval_minutes === 'number' || body.sync_interval_minutes !== undefined) {
    const v = Math.min(10080, Math.max(5, parseInt(String(body.sync_interval_minutes), 10) || 60))
    updates.sync_interval_minutes = v
  }
  if (body.supplier_id !== undefined) updates.supplier_id = body.supplier_id || null
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active

  const admin = createSupabaseAdmin()
  const { data, error } = await admin.from('integrations').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/**
 * DELETE – Integration löschen.
 */
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
  const { error } = await admin.from('integrations').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
