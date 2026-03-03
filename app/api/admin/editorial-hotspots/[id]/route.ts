/**
 * Blueprint TEIL 16: Editorial-Hotspot PATCH/DELETE
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const PULSE_STYLES = ['SUBTLE_GLOW', 'PULSE', 'NONE'] as const

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = {}
  if (body.product_id !== undefined) updates.product_id = body.product_id || null
  if (typeof body.pos_x_percentage === 'number' && body.pos_x_percentage >= 0 && body.pos_x_percentage <= 100) updates.pos_x_percentage = Math.round(body.pos_x_percentage * 100) / 100
  if (typeof body.pos_y_percentage === 'number' && body.pos_y_percentage >= 0 && body.pos_y_percentage <= 100) updates.pos_y_percentage = Math.round(body.pos_y_percentage * 100) / 100
  if (PULSE_STYLES.includes(body.pulse_animation_style)) updates.pulse_animation_style = body.pulse_animation_style
  if (Object.keys(updates).length === 0) return NextResponse.json({ error: 'Keine Änderung' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin.schema('retail_media').from('editorial_hotspots').update(updates).eq('hotspot_id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const id = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!id) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('retail_media').from('editorial_hotspots').delete().eq('hotspot_id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
