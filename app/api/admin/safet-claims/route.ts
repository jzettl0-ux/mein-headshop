/**
 * Blueprint 3.4: SAFE-T Claims (Verkäufer-Schutz)
 * GET – Liste aller Claims
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

const STATUS_LABELS: Record<string, string> = {
  UNDER_INVESTIGATION: 'In Prüfung',
  AWAITING_SELLER_INFO: 'Warte auf Händler-Infos',
  GRANTED: 'Bewilligt',
  DENIED: 'Abgelehnt',
}

const REASON_LABELS: Record<string, string> = {
  RETURNED_EMPTY_BOX: 'Leere Box zurück',
  RETURNED_MATERIALLY_DIFFERENT: 'Anderer Artikel zurück',
  RETURNED_DAMAGED: 'Beschädigter Artikel',
  NEVER_RECEIVED_RETURN: 'Rücksendung nicht erhalten',
}

export async function GET(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status') || ''

  const admin = createSupabaseAdmin()
  let query = admin
    .schema('seller_services')
    .from('safet_claims')
    .select('*')
    .order('created_at', { ascending: false })

  if (status && Object.keys(STATUS_LABELS).includes(status)) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) {
    console.error('[admin/safet-claims]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const list = (data ?? []).map((r: Record<string, unknown>) => ({
    ...r,
    status_label: STATUS_LABELS[String(r.status)] ?? r.status,
    reason_label: REASON_LABELS[String(r.claim_reason)] ?? r.claim_reason,
  }))
  return NextResponse.json({ claims: list })
}

export async function POST(req: NextRequest) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { vendor_id, order_id, order_item_id, order_line_id, claim_reason, requested_amount, evidence_urls, admin_notes } = body

  const vendorId = typeof vendor_id === 'string' ? vendor_id.trim() : ''
  const orderId = typeof order_id === 'string' ? order_id.trim() : ''
  const reason = typeof claim_reason === 'string' && Object.keys(REASON_LABELS).includes(claim_reason) ? claim_reason : null
  const amount = Math.max(0, parseFloat(String(requested_amount ?? 0)) || 0)

  if (!vendorId || !orderId) {
    return NextResponse.json({ error: 'vendor_id und order_id erforderlich' }, { status: 400 })
  }
  if (!reason) {
    return NextResponse.json({ error: 'claim_reason erforderlich (RETURNED_EMPTY_BOX, RETURNED_MATERIALLY_DIFFERENT, RETURNED_DAMAGED, NEVER_RECEIVED_RETURN)' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('seller_services')
    .from('safet_claims')
    .insert({
      vendor_id: vendorId,
      order_id: orderId,
      order_item_id: order_item_id?.trim() || null,
      order_line_id: order_line_id?.trim() || null,
      claim_reason: reason,
      requested_amount: amount,
      granted_amount: 0,
      evidence_urls: Array.isArray(evidence_urls) ? evidence_urls : [],
      admin_notes: typeof admin_notes === 'string' ? admin_notes.trim() || null : null,
      status: 'UNDER_INVESTIGATION',
    })
    .select()
    .single()

  if (error) {
    console.error('[admin/safet-claims] POST', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json(data)
}
