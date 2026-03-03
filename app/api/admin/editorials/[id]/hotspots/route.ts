/**
 * Blueprint TEIL 16: Editorial-Hotspots – POST (hinzufügen)
 */
import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const PULSE_STYLES = ['SUBTLE_GLOW', 'PULSE', 'NONE'] as const

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const editorialId = (await Promise.resolve(context.params).then((p) => p ?? {})).id
  if (!editorialId) return NextResponse.json({ error: 'id fehlt' }, { status: 400 })
  const body = await request.json().catch(() => ({}))
  const posX = Number(body.pos_x_percentage)
  const posY = Number(body.pos_y_percentage)
  if (isNaN(posX) || isNaN(posY) || posX < 0 || posX > 100 || posY < 0 || posY > 100)
    return NextResponse.json({ error: 'pos_x_percentage und pos_y_percentage 0–100 erforderlich' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('retail_media')
    .from('editorial_hotspots')
    .insert({
      editorial_id: editorialId,
      product_id: body.product_id || null,
      pos_x_percentage: Math.round(posX * 100) / 100,
      pos_y_percentage: Math.round(posY * 100) / 100,
      pulse_animation_style: PULSE_STYLES.includes(body.pulse_animation_style) ? body.pulse_animation_style : 'SUBTLE_GLOW',
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
