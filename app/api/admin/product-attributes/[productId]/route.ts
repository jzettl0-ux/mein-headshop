/**
 * Blueprint TEIL 20.1: PATCH/DELETE product_attributes by product_id
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ productId: string }> | { productId: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const productId = (await Promise.resolve(context.params).then((p) => p ?? {})).productId
  if (!productId) return NextResponse.json({ error: 'productId fehlt' }, { status: 400 })
  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { product_id: productId }
  if (body.physical_weight_grams !== undefined) updates.physical_weight_grams = body.physical_weight_grams == null ? null : Math.max(0, Math.floor(Number(body.physical_weight_grams)))
  if (body.physical_thickness_mm !== undefined) updates.physical_thickness_mm = body.physical_thickness_mm == null ? null : Math.max(0, Math.floor(Number(body.physical_thickness_mm)))
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('catalog')
    .from('product_attributes')
    .upsert(updates, { onConflict: 'product_id' })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(
  _req: NextRequest,
  context: { params: Promise<{ productId: string }> | { productId: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const productId = (await Promise.resolve(context.params).then((p) => p ?? {})).productId
  if (!productId) return NextResponse.json({ error: 'productId fehlt' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { error } = await admin.schema('catalog').from('product_attributes').delete().eq('product_id', productId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
