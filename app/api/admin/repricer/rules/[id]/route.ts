/**
 * Repricer: Regel bearbeiten / löschen
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (body.min_price != null) updates.min_price = Math.max(0, parseFloat(String(body.min_price)) || 0)
  if (body.max_price != null) updates.max_price = Math.max(0, parseFloat(String(body.max_price)) || 999)
  if (body.rule_type && ['MATCH_BUY_BOX', 'STAY_BELOW_BUY_BOX', 'MATCH_LOWEST_PRICE'].includes(body.rule_type))
    updates.rule_type = body.rule_type
  if (body.price_offset != null) updates.price_offset = parseFloat(String(body.price_offset)) || 0
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active

  updates.updated_at = new Date().toISOString()

  if (Object.keys(updates).length <= 1) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('pricing')
    .from('automated_rules')
    .update(updates)
    .eq('rule_id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('pricing').from('automated_rules').delete().eq('rule_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
