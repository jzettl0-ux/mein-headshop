import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** GET – Produkte dieses Lieferanten (für SKU-Mapping). Bevorzugt supplier_products (pro Lieferant), sonst product-Felder. */
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
  const { data: products, error } = await admin
    .from('products')
    .select('id, name, supplier_sku, supplier_product_name, cost_price')
    .eq('supplier_id', id)
    .order('name')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const productIds = (products ?? []).map((p: { id: string }) => p.id)
  let spMap: Record<string, { supplier_sku: string | null; supplier_product_name: string | null }> = {}
  if (productIds.length > 0) {
    const { data: spRows } = await admin
      .from('supplier_products')
      .select('product_id, supplier_sku, supplier_product_name')
      .eq('supplier_id', id)
      .in('product_id', productIds)
    for (const sp of spRows ?? []) {
      spMap[sp.product_id] = {
        supplier_sku: sp.supplier_sku ?? null,
        supplier_product_name: sp.supplier_product_name ?? null,
      }
    }
  }

  const result = (products ?? []).map((p: { id: string; name: string; supplier_sku: string | null; supplier_product_name: string | null; cost_price: number | null }) => {
    const fromSp = spMap[p.id]
    return {
      id: p.id,
      name: p.name,
      supplier_sku: fromSp?.supplier_sku ?? p.supplier_sku ?? null,
      supplier_product_name: fromSp?.supplier_product_name ?? p.supplier_product_name ?? null,
      cost_price: p.cost_price,
    }
  })
  return NextResponse.json(result)
}

/** POST – SKU-Mapping für ein Produkt speichern (supplier_products upsert + optional product-Felder synchronisieren) */
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
  const productId = typeof body.product_id === 'string' ? body.product_id.trim() : ''
  const supplierSku = typeof body.supplier_sku === 'string' ? body.supplier_sku.trim() || null : null
  const supplierProductName = typeof body.supplier_product_name === 'string' ? body.supplier_product_name.trim() || null : null

  if (!productId) return NextResponse.json({ error: 'product_id fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: product } = await admin.from('products').select('id, supplier_id').eq('id', productId).single()
  if (!product) return NextResponse.json({ error: 'Produkt nicht gefunden' }, { status: 404 })

  const { error: upsertErr } = await admin
    .from('supplier_products')
    .upsert(
      {
        supplier_id: supplierId,
        product_id: productId,
        supplier_sku: supplierSku ?? '',
        supplier_product_name: supplierProductName,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'supplier_id,product_id' }
    )
  if (upsertErr) return NextResponse.json({ error: upsertErr.message }, { status: 500 })

  if (product.supplier_id === supplierId) {
    await admin
      .from('products')
      .update({
        supplier_sku: supplierSku,
        supplier_product_name: supplierProductName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', productId)
  }

  return NextResponse.json({ ok: true })
}
