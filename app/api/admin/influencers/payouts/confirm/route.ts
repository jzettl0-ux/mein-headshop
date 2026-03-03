import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** POST – Auszahlung bestätigen (Status auf 'paid', paid_at setzen) */
export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const payoutId = typeof body.payout_id === 'string' ? body.payout_id.trim() : ''
  if (!payoutId) {
    return NextResponse.json({ error: 'payout_id erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data: payout, error: fetchErr } = await admin
    .from('influencer_payouts')
    .select('id, status')
    .eq('id', payoutId)
    .single()

  if (fetchErr || !payout) {
    return NextResponse.json({ error: 'Auszahlung nicht gefunden' }, { status: 404 })
  }
  if (payout.status !== 'requested' && payout.status !== 'pending') {
    return NextResponse.json({ error: 'Auszahlung wurde bereits bearbeitet' }, { status: 400 })
  }

  const { error: updateErr } = await admin
    .from('influencer_payouts')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', payoutId)

  if (updateErr) {
    return NextResponse.json({ error: updateErr.message }, { status: 500 })
  }

  return NextResponse.json({ ok: true, message: 'Auszahlung bestätigt' })
}
