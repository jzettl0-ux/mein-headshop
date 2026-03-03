/**
 * Blueprint TEIL 20.1: PATCH/DELETE einzelne Routing Rule
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const body = await _req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.max_weight_grams === 'number' && body.max_weight_grams >= 0) updates.max_weight_grams = Math.floor(body.max_weight_grams)
  if (typeof body.max_thickness_mm === 'number' && body.max_thickness_mm >= 0) updates.max_thickness_mm = Math.floor(body.max_thickness_mm)
  if (typeof body.max_price_value === 'number' && body.max_price_value >= 0) updates.max_price_value = Math.round(body.max_price_value * 100) / 100
  if (body.assigned_shipping_method != null) updates.assigned_shipping_method = String(body.assigned_shipping_method)
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('logistics_optimization')
    .from('routing_rules')
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
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('logistics_optimization').from('routing_rules').delete().eq('rule_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
