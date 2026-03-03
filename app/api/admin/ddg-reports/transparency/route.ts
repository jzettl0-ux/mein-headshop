/**
 * Phase 5.3: Transparenzbericht §17 DDG
 * GET – Aggregierte Statistiken und Export (JSON/CSV)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const VIOLATION_LABELS: Record<string, string> = {
  ILLEGAL_DRUG_CONTENT: 'Illegale Drogen',
  YOUTH_PROTECTION: 'Jugendschutz',
  IP_INFRINGEMENT: 'Geistiges Eigentum',
  OTHER: 'Sonstiges',
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Offen',
  INVESTIGATING: 'In Prüfung',
  REMOVED: 'Entfernt',
  DISMISSED: 'Abgelehnt',
}

function getDefaultDateRange(): { from: Date; to: Date } {
  const to = new Date()
  const from = new Date(to)
  from.setFullYear(from.getFullYear() - 1)
  return { from, to }
}

function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const format = searchParams.get('format') || 'json'
  const fromParam = searchParams.get('from')
  const toParam = searchParams.get('to')

  let from: Date
  let to: Date
  if (fromParam && toParam) {
    from = new Date(fromParam)
    to = new Date(toParam)
    if (isNaN(from.getTime()) || isNaN(to.getTime())) {
      const def = getDefaultDateRange()
      from = def.from
      to = def.to
    }
  } else {
    const def = getDefaultDateRange()
    from = def.from
    to = def.to
  }

  const admin = createSupabaseAdmin()
  const { data: rows, error } = await admin
    .schema('compliance')
    .from('ddg_content_reports')
    .select('report_id, target_asin, violation_type, status, reported_at, resolved_at, is_trusted_flagger, action_taken')
    .gte('reported_at', from.toISOString())
    .lte('reported_at', to.toISOString())
    .order('reported_at', { ascending: true })

  if (error) {
    console.error('[admin/ddg-reports/transparency]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = rows ?? []

  const byStatus: Record<string, number> = {}
  const byViolation: Record<string, number> = {}
  const resolutionTimesHours: number[] = []
  let trustedFlaggerCount = 0

  for (const r of list) {
    const status = String(r.status || 'PENDING')
    byStatus[status] = (byStatus[status] || 0) + 1
    const violation = String(r.violation_type || 'OTHER')
    byViolation[violation] = (byViolation[violation] || 0) + 1
    if (r.is_trusted_flagger) trustedFlaggerCount++
    if (r.resolved_at && r.reported_at) {
      const ms = new Date(r.resolved_at).getTime() - new Date(r.reported_at).getTime()
      resolutionTimesHours.push(ms / (1000 * 60 * 60))
    }
  }

  const medianHours = median(resolutionTimesHours)
  const medianDays = medianHours != null ? Math.round(medianHours / 24 * 10) / 10 : null

  const stats = {
    period: { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) },
    total: list.length,
    by_status: Object.fromEntries(
      Object.entries(byStatus).map(([k, v]) => [k, { count: v, label: STATUS_LABELS[k] ?? k }])
    ),
    by_violation_type: Object.fromEntries(
      Object.entries(byViolation).map(([k, v]) => [k, { count: v, label: VIOLATION_LABELS[k] ?? k }])
    ),
    trusted_flagger_reports: trustedFlaggerCount,
    median_resolution_hours: medianHours,
    median_resolution_days: medianDays,
    resolved_count: (byStatus['REMOVED'] || 0) + (byStatus['DISMISSED'] || 0),
  }

  if (format === 'csv') {
    const header = 'report_id;reported_at;violation_type;violation_label;status;status_label;resolved_at;resolution_hours;is_trusted_flagger'
    const lines = list.map((r: Record<string, unknown>) => {
      const reported = r.reported_at ? new Date(r.reported_at as string).toISOString() : ''
      const resolved = r.resolved_at ? new Date(r.resolved_at as string).toISOString() : ''
      let hours = ''
      if (r.resolved_at && r.reported_at) {
        const ms = new Date(r.resolved_at as string).getTime() - new Date(r.reported_at as string).getTime()
        hours = String(Math.round(ms / (1000 * 60 * 60) * 10) / 10)
      }
      const v = String(r.violation_type || 'OTHER')
      const s = String(r.status || 'PENDING')
      return `${r.report_id};${reported};${v};${VIOLATION_LABELS[v] ?? v};${s};${STATUS_LABELS[s] ?? s};${resolved};${hours};${r.is_trusted_flagger ? '1' : '0'}`
    })
    const csv = [header, ...lines].join('\n')
    const BOM = '\uFEFF'
    return new NextResponse(BOM + csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="ddg-transparenzbericht-${stats.period.from}-${stats.period.to}.csv"`,
      },
    })
  }

  return NextResponse.json({ stats, reports_count: list.length })
}
