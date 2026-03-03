import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Return-Inspection für Bestellung laden */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const orderId = resolved?.id
  if (!orderId) return NextResponse.json({ error: 'Order-ID fehlt' }, { status: 400 })

  try {
    const admin = createSupabaseAdmin()
    const { data, error } = await admin
      .schema('advanced_ops')
      .from('return_inspections')
      .select('*')
      .eq('order_id', orderId)
      .maybeSingle()

    if (error) return NextResponse.json(null)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json(null)
  }
}

/** PATCH – Return-Inspection aktualisieren (condition, restocking_fee, notes) */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin, user } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const resolved = await Promise.resolve(context.params)
  const orderId = resolved?.id
  if (!orderId) return NextResponse.json({ error: 'Order-ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  const cond = body.condition_code
  if (cond === null || (typeof cond === 'string' && ['as_new', 'minor_damage', 'major_damage', 'not_restockable'].includes(cond))) {
    updates.condition_code = cond ?? null
  }
  if (typeof body.restocking_fee_cents === 'number' && body.restocking_fee_cents >= 0) {
    updates.restocking_fee_cents = Math.floor(body.restocking_fee_cents)
  }
  if (typeof body.notes === 'string') {
    updates.notes = body.notes.trim() || null
  }
  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  }

  updates.status = 'inspected'
  updates.inspected_at = new Date().toISOString()
  updates.inspected_by_email = user?.email ?? null

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('advanced_ops')
    .from('return_inspections')
    .update(updates)
    .eq('order_id', orderId)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
