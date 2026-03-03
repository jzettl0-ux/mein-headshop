import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Alle Artikel dieses Lieferanten (supplier_products + Produktname falls verknüpft) */
export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const id = params?.id
  if (!id) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: rows, error } = await admin
    .from('supplier_products')
    .select('id, supplier_id, supplier_sku, supplier_product_name, product_id, api_product_id, order_url, notes, created_at, updated_at')
    .eq('supplier_id', id)
    .order('supplier_sku')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const productIds = [...new Set((rows || []).map((r) => r.product_id).filter(Boolean))] as string[]
  let productMap: Record<string, { id: string; name: string; slug: string }> = {}
  if (productIds.length > 0) {
    const { data: products } = await admin
      .from('products')
      .select('id, name, slug')
      .in('id', productIds)
    for (const p of products || []) {
      productMap[p.id] = { id: p.id, name: p.name, slug: p.slug }
    }
  }

  const list = (rows || []).map((r) => ({
    ...r,
    product: r.product_id ? productMap[r.product_id] ?? null : null,
  }))
  return NextResponse.json(list)
}

/** POST – Neuen Lieferanten-Artikel anlegen. Body: supplier_sku, supplier_product_name?, product_id?, api_product_id?, order_url?, notes? */
export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const supplierId = params?.id
  if (!supplierId) return NextResponse.json({ error: 'Lieferant-ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const supplier_sku = typeof body.supplier_sku === 'string' ? body.supplier_sku.trim() : ''
  if (!supplier_sku) return NextResponse.json({ error: 'supplier_sku ist Pflicht' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const insert: Record<string, unknown> = {
    supplier_id: supplierId,
    supplier_sku,
    supplier_product_name: body.supplier_product_name != null && String(body.supplier_product_name).trim() ? String(body.supplier_product_name).trim() : null,
    product_id: body.product_id && String(body.product_id).trim() ? body.product_id : null,
    api_product_id: body.api_product_id != null && String(body.api_product_id).trim() ? String(body.api_product_id).trim() : null,
    order_url: body.order_url != null && String(body.order_url).trim() ? String(body.order_url).trim() : null,
    notes: body.notes != null && String(body.notes).trim() ? String(body.notes).trim() : null,
    updated_at: new Date().toISOString(),
  }

  const { data, error } = await admin.from('supplier_products').insert(insert).select().single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Dieses Shop-Produkt ist bei diesem Lieferanten bereits verknüpft.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  if (insert.product_id) {
    await admin.from('products').update({ supplier_id: supplierId, updated_at: new Date().toISOString() }).eq('id', insert.product_id)
  }
  return NextResponse.json(data)
}
