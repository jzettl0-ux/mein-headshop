import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** PATCH – Commission Rule bearbeiten */
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await request.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}

  if (typeof body.rule_name === 'string' && body.rule_name.trim()) updates.rule_name = body.rule_name.trim()
  if (body.category_id !== undefined) updates.category_id = body.category_id || null
  if (body.vendor_id !== undefined) updates.vendor_id = body.vendor_id || null
  if (typeof body.percentage_fee === 'number') updates.percentage_fee = body.percentage_fee
  if (typeof body.fixed_fee === 'number') updates.fixed_fee = body.fixed_fee
  if (typeof body.is_active === 'boolean') updates.is_active = body.is_active
  if (typeof body.priority === 'number') updates.priority = body.priority

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('commission_rules')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE – Commission Rule löschen */
export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await Promise.resolve(context.params).then((p) => p ?? {})
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('commission_rules').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
