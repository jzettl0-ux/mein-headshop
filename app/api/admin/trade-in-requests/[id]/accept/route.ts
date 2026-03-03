/**
 * POST – Trade-In akzeptieren und Store Credit gutschreiben
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { creditStoreWallet } from '@/lib/store-credit'

export const dynamic = 'force-dynamic'

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  const body = await req.json().catch(() => ({}))
  const amount = typeof body.amount === 'number' ? body.amount : parseFloat(String(body.amount ?? 0).replace(',', '.'))

  const admin = createSupabaseAdmin()
  const { data: row, error: fetchErr } = await admin
    .schema('recommerce')
    .from('trade_in_requests')
    .select('trade_in_id, customer_id, quoted_value, status, final_credited_amount')
    .eq('trade_in_id', id)
    .single()

  if (fetchErr || !row) {
    return NextResponse.json({ error: 'Trade-In nicht gefunden' }, { status: 404 })
  }

  if (row.status === 'ACCEPTED') {
    return NextResponse.json({ error: 'Bereits akzeptiert und gutgeschrieben' }, { status: 400 })
  }

  if (!row.customer_id) {
    return NextResponse.json({ error: 'Kein Kundenkonto verknüpft' }, { status: 400 })
  }

  const creditAmount = amount > 0 ? amount : Number(row.quoted_value ?? 0)
  if (creditAmount <= 0) {
    return NextResponse.json({ error: 'Betrag muss positiv sein' }, { status: 400 })
  }

  const result = await creditStoreWallet(
    admin,
    row.customer_id,
    creditAmount,
    'TRADE_IN',
    row.trade_in_id
  )

  if (!result.ok) {
    return NextResponse.json({ error: result.error ?? 'Gutschrift fehlgeschlagen' }, { status: 500 })
  }

  await admin
    .schema('recommerce')
    .from('trade_in_requests')
    .update({
      status: 'ACCEPTED',
      final_credited_amount: creditAmount,
      updated_at: new Date().toISOString(),
    })
    .eq('trade_in_id', id)

  return NextResponse.json({
    success: true,
    credited_amount: creditAmount,
    new_balance: result.newBalance,
  })
}
