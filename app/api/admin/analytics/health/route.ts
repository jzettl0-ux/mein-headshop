import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Aggregierte Statistiken aus server_event_logs (Tracking-Integrität). Nur Admins. */
export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const now = new Date()
  const sevenDaysAgo = new Date(now)
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  const fromIso = sevenDaysAgo.toISOString()

  const { data: rows, error } = await admin
    .from('server_event_logs')
    .select('event_name, source, consent_ok, forwarded, created_at')
    .gte('created_at', fromIso)

  if (error) {
    console.error('analytics/health query error', error)
    return NextResponse.json({ error: 'Abfrage fehlgeschlagen' }, { status: 500 })
  }

  const list = rows || []
  const totalClient = list.filter((r) => r.source === 'client').length
  const totalServer = list.filter((r) => r.source === 'server').length
  const totalForwarded = list.filter((r) => r.forwarded === true).length
  const clientForwarded = list.filter((r) => r.source === 'client' && r.forwarded === true).length

  const byEvent: Record<string, { client: number; server: number; forwarded: number }> = {}
  for (const r of list) {
    const name = r.event_name || 'unknown'
    if (!byEvent[name]) byEvent[name] = { client: 0, server: 0, forwarded: 0 }
    if (r.source === 'client') byEvent[name].client += 1
    else byEvent[name].server += 1
    if (r.forwarded) byEvent[name].forwarded += 1
  }

  const byDay: Record<string, { client: number; server: number; forwarded: number }> = {}
  for (let d = 0; d < 8; d++) {
    const date = new Date(now)
    date.setDate(date.getDate() - (7 - d))
    const key = date.toISOString().slice(0, 10)
    byDay[key] = { client: 0, server: 0, forwarded: 0 }
  }
  for (const r of list) {
    const key = r.created_at?.slice(0, 10)
    if (!key || !byDay[key]) continue
    if (r.source === 'client') byDay[key].client += 1
    else byDay[key].server += 1
    if (r.forwarded) byDay[key].forwarded += 1
  }

  const daily = Object.entries(byDay)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({
      date,
      label: new Date(date + 'Z').toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }),
      client: v.client,
      server: v.server,
      forwarded: v.forwarded,
    }))

  const eventBreakdown = Object.entries(byEvent).map(([name, v]) => ({
    event_name: name,
    client: v.client,
    server: v.server,
    forwarded: v.forwarded,
  }))

  return NextResponse.json({
    total_client: totalClient,
    total_server: totalServer,
    total_forwarded: totalForwarded,
    client_forwarded: clientForwarded,
    daily,
    event_breakdown: eventBreakdown,
  })
}
