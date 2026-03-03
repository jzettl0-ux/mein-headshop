import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getConnector } from '@/lib/connectors'

/**
 * GET /api/cron/sync-products?secret=DEIN_CRON_SECRET
 * Läuft alle aktiven Integrationen durch und führt einen Produkt-Sync durch,
 * sofern das Sync-Intervall abgelaufen ist (oder noch nie gesynct).
 * Aufruf z. B. alle 5–15 Minuten per Vercel Cron.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 300

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: integrations, error } = await admin
    .from('integrations')
    .select('*')
    .eq('is_active', true)

  if (error) {
    return NextResponse.json({ error: error.message, synced: 0 }, { status: 500 })
  }

  const now = Date.now()
  const toSync = (integrations ?? []).filter((row) => {
    const intervalMs = (row.sync_interval_minutes ?? 60) * 60 * 1000
    const last = row.last_sync_at ? new Date(row.last_sync_at).getTime() : 0
    return last + intervalMs <= now
  })

  const results: { id: string; name: string; success: boolean; message: string }[] = []

  for (const config of toSync) {
    const connector = getConnector(config.connector_type)
    if (!connector) {
      results.push({ id: config.id, name: config.name, success: false, message: `Connector "${config.connector_type}" nicht gefunden` })
      continue
    }
    try {
      const result = await connector.sync({
        id: config.id,
        name: config.name,
        connector_type: config.connector_type,
        api_endpoint: config.api_endpoint,
        api_key: config.api_key,
        sync_interval_minutes: config.sync_interval_minutes ?? 60,
        is_active: true,
        supplier_id: config.supplier_id,
        last_sync_at: config.last_sync_at,
        last_sync_status: config.last_sync_status,
        last_sync_message: config.last_sync_message,
      })
      results.push({
        id: config.id,
        name: config.name,
        success: result.success,
        message: result.message,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      results.push({ id: config.id, name: config.name, success: false, message: msg })
    }
  }

  const ok = results.filter((r) => r.success).length
  return NextResponse.json({
    message: `${ok}/${toSync.length} Integrationen erfolgreich synchronisiert`,
    synced: ok,
    total: toSync.length,
    results,
  })
}
