/**
 * GET – Trade-In Detail
 * PATCH – Status aktualisieren (IN_TRANSIT, INSPECTING, etc.)
 * POST accept – Akzeptieren + Store Credit gutschreiben
 * POST reject – Ablehnen
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { creditStoreWallet } from '@/lib/store-credit'

export const dynamic = 'force-dynamic'

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('recommerce')
    .from('trade_in_requests')
    .select('*, products(id, name, slug, price)')
    .eq('trade_in_id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Nicht gefunden' }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  const body = await req.json().catch(() => ({}))
  const { status } = body

  const allowed = ['PENDING', 'LABEL_GENERATED', 'IN_TRANSIT', 'INSPECTING', 'ACCEPTED', 'REJECTED', 'RETURNED_TO_CUSTOMER']
  if (!status || !allowed.includes(status)) {
    return NextResponse.json({ error: 'Ungültiger Status' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const updates: Record<string, unknown> = { status, updated_at: new Date().toISOString() }
  if (status === 'ACCEPTED' || status === 'REJECTED') {
    updates.final_credited_amount = status === 'ACCEPTED' ? body.final_amount ?? undefined : null
  }

  const { data, error } = await admin
    .schema('recommerce')
    .from('trade_in_requests')
    .update(updates)
    .eq('trade_in_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
