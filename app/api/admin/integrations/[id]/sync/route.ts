import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getConnector } from '@/lib/connectors'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

/**
 * POST – Manueller Sync für eine Integration („Sync Now“).
 */
export async function POST(
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
  const { data: config, error: fetchError } = await admin.from('integrations').select('*').eq('id', id).single()
  if (fetchError || !config) return NextResponse.json({ error: 'Integration nicht gefunden' }, { status: 404 })

  const connector = getConnector(config.connector_type)
  if (!connector) return NextResponse.json({ error: `Connector-Typ "${config.connector_type}" nicht implementiert` }, { status: 400 })

  const result = await connector.sync({
    id: config.id,
    name: config.name,
    connector_type: config.connector_type,
    api_endpoint: config.api_endpoint,
    api_key: config.api_key,
    sync_interval_minutes: config.sync_interval_minutes ?? 60,
    is_active: config.is_active !== false,
    supplier_id: config.supplier_id,
    last_sync_at: config.last_sync_at,
    last_sync_status: config.last_sync_status,
    last_sync_message: config.last_sync_message,
  })

  return NextResponse.json(result)
}
