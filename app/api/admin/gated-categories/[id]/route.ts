import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** PATCH – Gated Category aktualisieren (Secret Shop: min_loyalty_tier_required) */
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
  const minTier = typeof body.min_loyalty_tier_required === 'number'
    ? Math.max(1, Math.min(3, body.min_loyalty_tier_required))
    : body.min_loyalty_tier_required != null
      ? Math.max(1, Math.min(3, Number(body.min_loyalty_tier_required) || 1))
      : undefined

  if (minTier == null) return NextResponse.json({ error: 'min_loyalty_tier_required erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('admin')
    .from('gated_categories')
    .update({ min_loyalty_tier_required: minTier })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

/** DELETE – Gated Category entfernen */
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
  const { error } = await admin.schema('admin').from('gated_categories').delete().eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
