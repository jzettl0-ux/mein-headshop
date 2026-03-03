import { NextRequest, NextResponse } from 'next/server'
import { getInfluencerContext } from '@/lib/influencer-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Aktiver Rabattcode des Influencers */
export async function GET() {
  const { influencer, isInfluencer } = await getInfluencerContext()
  if (!isInfluencer || !influencer) {
    return NextResponse.json({ error: 'Nicht als Influencer angemeldet' }, { status: 403 })
  }
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: row } = await admin
    .from('discount_codes')
    .select('id, code, type, value, is_active')
    .eq('influencer_id', influencer.id)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  return NextResponse.json({
    code: row?.code ?? null,
    type: row?.type ?? null,
    value: row?.value != null ? Number(row.value) : null,
    is_active: row?.is_active ?? false,
    can_request_code_change: influencer.can_request_code_change,
  })
}

/** POST – Neuen Code anfragen (wenn can_request_code_change) */
export async function POST(req: NextRequest) {
  const { influencer, isInfluencer } = await getInfluencerContext()
  if (!isInfluencer || !influencer) {
    return NextResponse.json({ error: 'Nicht als Influencer angemeldet' }, { status: 403 })
  }
  if (!influencer.can_request_code_change) {
    return NextResponse.json({ error: 'Code-Änderung ist für dein Konto nicht freigegeben' }, { status: 403 })
  }

  const body = await req.json().catch(() => ({}))
  const requestedCode = typeof body.requested_code === 'string' ? body.requested_code.trim().toUpperCase() : ''
  if (!requestedCode || requestedCode.length < 3) {
    return NextResponse.json({ error: 'Bitte gib einen gültigen Code an (mind. 3 Zeichen)' }, { status: 400 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  const admin = createSupabaseAdmin()
  const { data: existing } = await admin.from('discount_codes').select('id').eq('code', requestedCode).maybeSingle()
  if (existing) {
    return NextResponse.json({ error: 'Dieser Code ist bereits vergeben' }, { status: 400 })
  }

  const { data: pending } = await admin
    .from('influencer_code_requests')
    .select('id')
    .eq('influencer_id', influencer.id)
    .eq('status', 'pending')
    .maybeSingle()
  if (pending) {
    return NextResponse.json({ error: 'Du hast bereits eine offene Code-Anfrage' }, { status: 400 })
  }

  await admin.from('influencer_code_requests').insert({
    influencer_id: influencer.id,
    requested_code: requestedCode,
    status: 'pending',
  })

  return NextResponse.json({ ok: true, message: 'Anfrage wurde gesendet. Der Admin wird sich darum kümmern.' })
}
