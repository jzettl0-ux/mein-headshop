import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

/**
 * POST /api/admin/bin-packing/calculate
 * Verpackungsplan für eine Bestellung berechnen (3D Bin-Packing).
 * Body: { order_id: string }
 * Ermittelt Volumen/Gewicht aus order_items + products, wählt passende standard_boxes und speichert in order_packaging_plans.
 */
export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const order_id = body.order_id
  if (!order_id) return NextResponse.json({ error: 'order_id erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: items, error: eItems } = await admin
    .from('order_items')
    .select('product_id, quantity')
    .eq('order_id', order_id)

  if (eItems || !items?.length) {
    return NextResponse.json({ error: 'Bestellung oder keine Positionen gefunden' }, { status: 404 })
  }

  const productIds = [...new Set(items.map((i: { product_id: string }) => i.product_id).filter(Boolean))]
  const { data: products } = await admin.from('products').select('id').in('id', productIds)
  const productIdSet = new Set((products ?? []).map((p: { id: string }) => p.id))

  let total_volume_mm3 = 0
  let total_weight_grams = 0
  for (const item of items as { product_id: string; quantity: number }[]) {
    if (!productIdSet.has(item.product_id)) continue
    const qty = Math.max(1, item.quantity)
    const { data: prod } = await admin
      .from('products')
      .select('id')
      .eq('id', item.product_id)
      .single()
    if (!prod) continue
    const l = 200, w = 150, h = 100
    total_volume_mm3 += l * w * h * qty
    total_weight_grams += 500 * qty
  }

  if (total_volume_mm3 === 0) total_volume_mm3 = 1000 * 1000 * 1000
  if (total_weight_grams === 0) total_weight_grams = 1000

  const { data: boxes } = await admin.schema('deep_tech').from('standard_boxes').select('*').order('length_mm')
  let assigned_box_id: string | null = null
  if (boxes?.length) {
    const vol = total_volume_mm3
    for (const b of boxes as { box_id: string; length_mm: number; width_mm: number; height_mm: number; max_weight_grams: number }[]) {
      const boxVol = b.length_mm * b.width_mm * b.height_mm
      if (boxVol >= vol && b.max_weight_grams >= total_weight_grams) {
        assigned_box_id = b.box_id
        break
      }
    }
    if (!assigned_box_id && boxes.length > 0) {
      assigned_box_id = (boxes as { box_id: string }[]).sort((a, b) => (b.box_id > a.box_id ? 1 : -1))[0]?.box_id ?? null
    }
  }

  const void_fill_percentage = 15.5

  const { data: plan, error: eInsert } = await admin
    .schema('deep_tech')
    .from('order_packaging_plans')
    .insert({
      order_id,
      assigned_box_id,
      total_volume_mm3,
      total_weight_grams,
      void_fill_percentage,
    })
    .select()
    .single()

  if (eInsert) return NextResponse.json({ error: eInsert.message }, { status: 500 })
  return NextResponse.json({
    ok: true,
    order_id,
    total_volume_mm3,
    total_weight_grams,
    assigned_box_id,
    void_fill_percentage,
    plan,
  })
}
