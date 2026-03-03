/**
 * Blueprint TEIL 20.6: Bestseller Rank PATCH/DELETE
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (typeof body.calculated_bsr_score === 'number' && body.calculated_bsr_score >= 0) updates.calculated_bsr_score = body.calculated_bsr_score
  if (body.current_rank_position !== undefined) updates.current_rank_position = body.current_rank_position == null ? null : Math.max(0, Math.floor(Number(body.current_rank_position)))
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog_automation')
    .from('bestseller_ranks')
    .update(updates)
    .eq('rank_id', id)
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
  const { error } = await admin.schema('catalog_automation').from('bestseller_ranks').delete().eq('rank_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
