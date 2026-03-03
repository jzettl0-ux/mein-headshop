import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

/** PATCH – Lieferanten-Artikel aktualisieren. Body: supplier_sku?, supplier_product_name?, product_id?, api_product_id?, order_url?, notes? */
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string; articleId: string }> | { id: string; articleId: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const { id: supplierId, articleId } = params || {}
  if (!supplierId || !articleId) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const body = await req.json().catch(() => ({}))
  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.supplier_sku !== undefined) updates.supplier_sku = typeof body.supplier_sku === 'string' ? body.supplier_sku.trim() : ''
  if (body.supplier_product_name !== undefined) updates.supplier_product_name = body.supplier_product_name != null && String(body.supplier_product_name).trim() ? String(body.supplier_product_name).trim() : null
  if (body.product_id !== undefined) updates.product_id = body.product_id && String(body.product_id).trim() ? body.product_id : null
  if (body.api_product_id !== undefined) updates.api_product_id = body.api_product_id != null && String(body.api_product_id).trim() ? String(body.api_product_id).trim() : null
  if (body.order_url !== undefined) updates.order_url = body.order_url != null && String(body.order_url).trim() ? String(body.order_url).trim() : null
  if (body.notes !== undefined) updates.notes = body.notes != null && String(body.notes).trim() ? String(body.notes).trim() : null

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .from('supplier_products')
    .update(updates)
    .eq('id', articleId)
    .eq('supplier_id', supplierId)
    .select()
    .single()
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'Dieses Shop-Produkt ist bei diesem Lieferanten bereits verknüpft.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  if (!data) return NextResponse.json({ error: 'Artikel nicht gefunden' }, { status: 404 })
  if (updates.product_id !== undefined && updates.product_id) {
    await admin.from('products').update({ supplier_id: supplierId, updated_at: new Date().toISOString() }).eq('id', updates.product_id)
  }
  return NextResponse.json(data)
}

/** DELETE – Lieferanten-Artikel löschen */
export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string; articleId: string }> | { id: string; articleId: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const { id: supplierId, articleId } = params || {}
  if (!supplierId || !articleId) return NextResponse.json({ error: 'ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { error } = await admin.from('supplier_products').delete().eq('id', articleId).eq('supplier_id', supplierId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
