/**
 * Phase 5.2: DDG Notice & Action – Admin-Übersicht
 * GET – Liste aller Content-Reports (nur Inhaber)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'Offen',
  INVESTIGATING: 'In Prüfung',
  REMOVED: 'Entfernt',
  DISMISSED: 'Abgelehnt',
}

const VIOLATION_LABELS: Record<string, string> = {
  ILLEGAL_DRUG_CONTENT: 'Illegale Drogen',
  YOUTH_PROTECTION: 'Jugendschutz',
  IP_INFRINGEMENT: 'Geistiges Eigentum',
  OTHER: 'Sonstiges',
}

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  const admin = createSupabaseAdmin()
  let query = admin
    .schema('compliance')
    .from('ddg_content_reports')
    .select('*')
    .order('reported_at', { ascending: false })

  if (status && ['PENDING', 'INVESTIGATING', 'REMOVED', 'DISMISSED'].includes(status)) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    console.error('[admin/ddg-reports]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    status_label: STATUS_LABELS[String(r.status)] ?? r.status,
    violation_label: VIOLATION_LABELS[String(r.violation_type)] ?? r.violation_type,
  }))

  return NextResponse.json({ reports: list })
}
