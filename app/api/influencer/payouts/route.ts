import { NextRequest, NextResponse } from 'next/server'
import { getInfluencerContext } from '@/lib/influencer-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Liste aller Auszahlungen + offener Betrag */
export async function GET() {
  const { influencer, isInfluencer } = await getInfluencerContext()
  if (!isInfluencer || !influencer) {
    return NextResponse.json({ error: 'Nicht als Influencer angemeldet' }, { status: 403 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: codes } = await admin.from('discount_codes').select('code').eq('influencer_id', influencer.id)
  const codeList = (codes ?? []).map((r) => (r as { code: string }).code)

  let totalEarned = 0
  if (codeList.length > 0) {
    const { data: orders } = await admin
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .in('discount_code', codeList)
    totalEarned = (orders ?? []).reduce((sum, o) => sum + Number(o.total ?? 0), 0) * (influencer.commission_rate / 100)
  }

  const { data: payouts } = await admin
    .from('influencer_payouts')
    .select('id, amount, status, requested_at, paid_at, created_at, note')
    .eq('influencer_id', influencer.id)
    .order('created_at', { ascending: false })

  const paidSum = (payouts ?? [])
    .filter((p) => p.status === 'paid')
    .reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const openBalance = Math.max(0, Math.round((totalEarned - paidSum) * 100) / 100)

  const list = (payouts ?? []).map((p) => ({
    id: p.id,
    amount: Number(p.amount),
    status: p.status,
    requested_at: p.requested_at,
    paid_at: p.paid_at,
    created_at: p.created_at,
    note: p.note,
  }))

  return NextResponse.json({
    payouts: list,
    open_balance: openBalance,
    total_earned: Math.round(totalEarned * 100) / 100,
  })
}

/** POST – Auszahlung anfordern (erstellt Eintrag mit offenem Betrag, Status requested) */
export async function POST(req: NextRequest) {
  const { influencer, isInfluencer } = await getInfluencerContext()
  if (!isInfluencer || !influencer) {
    return NextResponse.json({ error: 'Nicht als Influencer angemeldet' }, { status: 403 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: codes } = await admin.from('discount_codes').select('code').eq('influencer_id', influencer.id)
  const codeList = (codes ?? []).map((r) => (r as { code: string }).code)

  let totalEarned = 0
  if (codeList.length > 0) {
    const { data: orders } = await admin
      .from('orders')
      .select('total')
      .eq('payment_status', 'paid')
      .in('discount_code', codeList)
    totalEarned = (orders ?? []).reduce((sum, o) => sum + Number(o.total ?? 0), 0) * (influencer.commission_rate / 100)
  }

  const { data: payouts } = await admin
    .from('influencer_payouts')
    .select('amount')
    .eq('influencer_id', influencer.id)
    .eq('status', 'paid')
  const paidSum = (payouts ?? []).reduce((s, p) => s + Number(p.amount ?? 0), 0)
  const openBalance = Math.max(0, Math.round((totalEarned - paidSum) * 100) / 100)

  if (openBalance < 1) {
    return NextResponse.json({ error: 'Kein auszahlbarer Betrag (Mindestbetrag 1 €)' }, { status: 400 })
  }

  const { data: pending } = await admin
    .from('influencer_payouts')
    .select('id')
    .eq('influencer_id', influencer.id)
    .in('status', ['pending', 'requested'])
    .maybeSingle()
  if (pending) {
    return NextResponse.json({ error: 'Du hast bereits eine offene Auszahlungsanfrage' }, { status: 400 })
  }

  await admin.from('influencer_payouts').insert({
    influencer_id: influencer.id,
    amount: openBalance,
    status: 'requested',
    requested_at: new Date().toISOString(),
  })

  return NextResponse.json({ ok: true, message: 'Auszahlung wurde angefragt. Der Admin wird sich darum kümmern.' })
}
