import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { requireAdmin } from '@/lib/admin-auth'

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const admin = createSupabaseAdmin()
  const { data: rows, error } = await admin
    .schema('infrastructure')
    .from('frequently_bought_together')
    .select('*')
    .order('co_occurrence_count', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const ids = [...new Set((rows ?? []).flatMap((r: any) => [r.anchor_product_id, r.associated_product_id]))]
  const { data: prods } = ids.length
    ? await admin.from('products').select('id, name, slug').in('id', ids)
    : { data: [] }
  const nameMap = Object.fromEntries((prods ?? []).map((p: any) => [p.id, p.name]))
  const out = (rows ?? []).map((r: any) => ({
    ...r,
    anchor_name: nameMap[r.anchor_product_id],
    associated_name: nameMap[r.associated_product_id],
  }))
  return NextResponse.json(out)
}

export async function POST(request: NextRequest) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  const body = await request.json().catch(() => ({}))
  const anchorId = body.anchor_product_id
  const associatedId = body.associated_product_id
  const discount = Number(body.bundle_discount_percentage) || 0
  if (!anchorId || !associatedId)
    return NextResponse.json({ error: 'anchor_product_id und associated_product_id erforderlich' }, { status: 400 })
  if (anchorId === associatedId)
    return NextResponse.json({ error: 'Anchor und Assoziiertes Produkt müssen unterschiedlich sein' }, { status: 400 })
  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('infrastructure')
    .from('frequently_bought_together')
    .upsert(
      {
        anchor_product_id: anchorId,
        associated_product_id: associatedId,
        co_occurrence_count: 0,
        is_virtual_bundle: true,
        bundle_discount_percentage: Math.min(100, Math.max(0, discount)),
      },
      { onConflict: 'anchor_product_id,associated_product_id' }
    )
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
