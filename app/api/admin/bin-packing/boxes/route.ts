import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/** GET – Standard-Boxen (3D Bin-Packing) */
export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json([])

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('deep_tech')
    .from('standard_boxes')
    .select('*')
    .order('box_id')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data ?? [])
}

/** POST – Neue Standard-Box anlegen */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const box_id = typeof body.box_id === 'string' ? body.box_id.trim() : ''
  const length_mm = Number(body.length_mm)
  const width_mm = Number(body.width_mm)
  const height_mm = Number(body.height_mm)
  const max_weight_grams = Number(body.max_weight_grams)

  if (!box_id || length_mm <= 0 || width_mm <= 0 || height_mm <= 0 || max_weight_grams <= 0) {
    return NextResponse.json({ error: 'box_id, length_mm, width_mm, height_mm, max_weight_grams (positiv) erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('deep_tech')
    .from('standard_boxes')
    .insert({ box_id, length_mm, width_mm, height_mm, max_weight_grams })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
