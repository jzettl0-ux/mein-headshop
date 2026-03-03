/**
 * Blueprint TEIL 20.1: catalog.product_attributes (Gewicht/Dicke für Small & Light)
 * GET: Liste (mit product name) | POST: Upsert pro product_id
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get('product_id')
  const admin = createSupabaseAdmin()
  let q = admin.schema('catalog').from('product_attributes').select('*').order('product_id')
  if (productId) q = q.eq('product_id', productId)
  const { data: rows, error } = await q
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const list = (rows ?? []) as Array<{ product_id: string }>
  const pIds = [...new Set(list.map((r) => r.product_id))]
  let names: Array<{ id: string; name: string | null }> = []
  if (pIds.length > 0) {
    const { data: p } = await admin.from('products').select('id, name').in('id', pIds)
    names = (p ?? []) as Array<{ id: string; name: string | null }>
  }
  const byId = Object.fromEntries(names.map((n) => [n.id, n.name]))
  const result = list.map((r) => ({ ...r, product_name: byId[r.product_id] ?? null }))
  return NextResponse.json(result)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const productId = body.product_id
  if (!productId) return NextResponse.json({ error: 'product_id fehlt' }, { status: 400 })
  const weight = body.physical_weight_grams != null ? Math.max(0, Math.floor(Number(body.physical_weight_grams))) : null
  const thickness = body.physical_thickness_mm != null ? Math.max(0, Math.floor(Number(body.physical_thickness_mm))) : null
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog')
    .from('product_attributes')
    .upsert(
      {
        product_id: productId,
        physical_weight_grams: weight,
        physical_thickness_mm: thickness,
      },
      { onConflict: 'product_id' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
