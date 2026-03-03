/**
 * GET /api/cron/refresh-vault-drops?secret=CRON_SECRET
 * Aktualisiert gamification.vault_drops: SCHEDULED→ACTIVE, ACTIVE→SOLD_OUT/CLOSED.
 * Vercel Cron: z. B. alle 15 Min.
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

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
  const now = new Date().toISOString()

  const { data: drops } = await admin
    .schema('gamification')
    .from('vault_drops')
    .select('drop_id, status, start_timestamp, end_timestamp, units_sold, total_units_available')
    .in('status', ['SCHEDULED', 'ACTIVE'])

  if (!drops?.length) {
    return NextResponse.json({ ok: true, updated: 0, message: 'Keine aktiven Vault Drops.' })
  }

  let updated = 0
  for (const d of drops as { drop_id: string; status: string; start_timestamp: string; end_timestamp: string; units_sold: number; total_units_available: number }[]) {
    let newStatus: string | null = null
    if (now < d.start_timestamp) continue
    if (now > d.end_timestamp) {
      newStatus = (d.units_sold ?? 0) >= (d.total_units_available ?? 1) ? 'SOLD_OUT' : 'CLOSED'
    } else if (d.status === 'SCHEDULED') {
      newStatus = 'ACTIVE'
    } else if (d.status === 'ACTIVE' && (d.units_sold ?? 0) >= (d.total_units_available ?? 1)) {
      newStatus = 'SOLD_OUT'
    }
    if (newStatus) {
      const { error } = await admin
        .schema('gamification')
        .from('vault_drops')
        .update({ status: newStatus })
        .eq('drop_id', d.drop_id)
      if (!error) updated++
    }
  }

  return NextResponse.json({
    ok: true,
    updated,
    message: `Vault Drops: ${updated} Status aktualisiert.`,
  })
}
