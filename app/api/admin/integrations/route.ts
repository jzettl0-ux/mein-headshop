import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getConnectorTypes } from '@/lib/connectors'

export const dynamic = 'force-dynamic'

/**
 * GET – Liste aller Integrationen (mit optionalem Supplier-Join).
 */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data: integrations, error } = await admin
    .from('integrations')
    .select('*, suppliers(id, name)')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = (integrations ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    api_key: row.api_key ? '••••' : null,
  }))
  return NextResponse.json(list)
}

/**
 * POST – Neue Integration anlegen.
 * Body: name, connector_type, api_endpoint, api_key?, sync_interval_minutes?, supplier_id?, is_active?
 */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const connector_type = typeof body.connector_type === 'string' ? body.connector_type.trim() : ''
  const api_endpoint = typeof body.api_endpoint === 'string' ? body.api_endpoint.trim() : ''

  if (!name || !connector_type || !api_endpoint) {
    return NextResponse.json({ error: 'name, connector_type und api_endpoint sind erforderlich.' }, { status: 400 })
  }

  const types = getConnectorTypes()
  if (!types.some((t) => t.value === connector_type)) {
    return NextResponse.json({ error: 'Unbekannter connector_type.' }, { status: 400 })
  }

  const sync_interval_minutes = Math.min(10080, Math.max(5, parseInt(String(body.sync_interval_minutes || 60), 10) || 60))
  const api_key = typeof body.api_key === 'string' ? body.api_key.trim() || null : null
  const supplier_id = body.supplier_id || null
  const is_active = body.is_active !== false

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('integrations')
    .insert({
      name,
      connector_type,
      api_endpoint,
      api_key,
      sync_interval_minutes,
      supplier_id: supplier_id || null,
      is_active,
      last_sync_status: 'pending',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
