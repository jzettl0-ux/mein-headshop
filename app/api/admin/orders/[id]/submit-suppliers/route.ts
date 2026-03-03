import { NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { MockInfluencerConnector } from '@/lib/connectors/mock-influencer'
import { sendSupplierOrderEmail } from '@/lib/send-order-email'
import type { SupplierOrderPayload } from '@/lib/connectors/base'

export const dynamic = 'force-dynamic'

/**
 * POST – One-Click: Bestellung an alle Lieferanten übermitteln.
 * Verwendet Supplier SKU und Supplier Produktname aus dem Produkt-Mapping.
 * API-Lieferanten: POST mit gemappter SKU (external_id); E-Mail-Lieferanten: HTML-Mail mit Betreff "Bestellung SKU: [SKUs]".
 */
export async function POST(
  _req: Request,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Keine Berechtigung' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const params = await Promise.resolve(context.params)
  const orderId = params?.id
  if (!orderId) return NextResponse.json({ error: 'Order-ID fehlt' }, { status: 400 })

  const admin = createSupabaseAdmin()
  const { data: order, error: orderErr } = await admin.from('orders').select('*').eq('id', orderId).single()
  if (orderErr || !order) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })

  const { data: items, error: itemsErr } = await admin
    .from('order_items')
    .select('id, product_id, product_name, quantity, price, total')
    .eq('order_id', orderId)
  if (itemsErr) return NextResponse.json({ error: itemsErr.message }, { status: 500 })

  const productIds = [...new Set((items || []).map((i: { product_id?: string }) => i.product_id).filter(Boolean))] as string[]
  let productInfo: Record<string, { supplier_id: string; supplier_sku?: string | null; supplier_product_name?: string | null; api_product_id?: string | null }> = {}
  if (productIds.length > 0) {
    const { data: products } = await admin
      .from('products')
      .select('id, supplier_id, supplier_sku, supplier_product_name')
      .in('id', productIds)
    let mapByPair: Record<string, { supplier_sku?: string | null; supplier_product_name?: string | null; api_product_id?: string | null }> = {}
    if (productIds.length > 0) {
      const { data: spRows } = await admin
        .from('supplier_products')
        .select('supplier_id, product_id, supplier_sku, supplier_product_name, api_product_id')
        .in('product_id', productIds)
      for (const sp of spRows || []) {
        const key = `${sp.supplier_id}:${sp.product_id}`
        mapByPair[key] = {
          supplier_sku: sp.supplier_sku ?? null,
          supplier_product_name: sp.supplier_product_name ?? null,
          api_product_id: sp.api_product_id ?? null,
        }
      }
    }
    for (const p of products || []) {
      if (!p.supplier_id) continue
      const key = `${p.supplier_id}:${p.id}`
      const fromSp = mapByPair[key]
      productInfo[p.id] = {
        supplier_id: p.supplier_id,
        supplier_sku: fromSp?.supplier_sku ?? p.supplier_sku ?? null,
        supplier_product_name: fromSp?.supplier_product_name ?? p.supplier_product_name ?? null,
        api_product_id: fromSp?.api_product_id ?? null,
      }
    }
  }

  const bySupplier = new Map<
    string,
    { product_name: string; quantity: number; price: number; supplier_sku?: string | null; supplier_product_name?: string | null; api_product_id?: string | null }[]
  >()
  for (const row of items || []) {
    const info = row.product_id ? productInfo[row.product_id] : null
    if (!info) continue
    const entry = bySupplier.get(info.supplier_id) ?? []
    entry.push({
      product_name: row.product_name ?? 'Artikel',
      quantity: Number(row.quantity) || 1,
      price: Number(row.price) ?? 0,
      supplier_sku: info.supplier_sku,
      supplier_product_name: info.supplier_product_name,
      api_product_id: info.api_product_id,
    })
    bySupplier.set(info.supplier_id, entry)
  }

  if (bySupplier.size === 0) {
    return NextResponse.json({ error: 'Keine Artikel mit zugeordnetem Lieferanten.', submitted: 0 }, { status: 400 })
  }

  const { data: suppliers } = await admin
    .from('suppliers')
    .select('id, name, contact_email, order_email, type, api_endpoint, api_key, api_headers')
    .in('id', [...bySupplier.keys()])
  const supplierById = new Map((suppliers || []).map((s) => [s.id, s]))

  const { data: existingSubmissions } = await admin
    .from('order_supplier_submissions')
    .select('supplier_id')
    .eq('order_id', orderId)
  const alreadySubmitted = new Set((existingSubmissions || []).map((s: { supplier_id: string }) => s.supplier_id))

  const shippingAddress = (order.shipping_address as Record<string, unknown>) || {}
  const connector = new MockInfluencerConnector()
  let submitted = 0

  for (const [supplierId, itemRows] of bySupplier) {
    if (alreadySubmitted.has(supplierId)) continue
    const supplier = supplierById.get(supplierId)
    if (!supplier) continue

    const method = supplier.type === 'api' ? 'api' : 'email'
    const apiHeaders = (supplier.api_headers && typeof supplier.api_headers === 'object') ? supplier.api_headers : {}

    if (supplier.type === 'api') {
      const payload: SupplierOrderPayload = {
        order_number: order.order_number,
        customer_name: order.customer_name ?? '',
        shipping_address: {
          street: shippingAddress.street as string | undefined,
          house_number: shippingAddress.house_number as string | undefined,
          postal_code: shippingAddress.postal_code as string | undefined,
          city: shippingAddress.city as string | undefined,
          country: shippingAddress.country as string | undefined,
        },
        items: itemRows.map((i) => ({
          product_name: (i.supplier_product_name || i.product_name) ?? 'Artikel',
          quantity: i.quantity,
          price: i.price,
          external_id: (i.api_product_id || i.supplier_sku) ?? undefined,
        })),
      }
      const result = connector.submitOrder
        ? await connector.submitOrder(
            {
              api_endpoint: supplier.api_endpoint ?? '',
              api_key: supplier.api_key,
              api_headers: apiHeaders,
            },
            payload
          )
        : { ok: false, error: 'submitOrder nicht verfügbar' }
      if (result.ok) {
        await admin.from('order_supplier_submissions').upsert(
          { order_id: orderId, supplier_id: supplierId, method },
          { onConflict: 'order_id,supplier_id' }
        )
        submitted++
      }
    } else {
      const to = (supplier.order_email || supplier.contact_email)?.trim()
      if (!to) continue
      const skus = itemRows.map((i) => i.supplier_sku).filter(Boolean)
      const subject = skus.length > 0 ? `Bestellung SKU: ${skus.join(', ')}` : `Bestellung #${order.order_number}`
      const result = await sendSupplierOrderEmail({
        to,
        orderNumber: order.order_number,
        customerName: order.customer_name ?? '',
        shippingAddress: {
          street: shippingAddress.street as string | undefined,
          house_number: shippingAddress.house_number as string | undefined,
          postal_code: shippingAddress.postal_code as string | undefined,
          city: shippingAddress.city as string | undefined,
          country: shippingAddress.country as string | undefined,
        },
        items: itemRows.map((i) => ({
          product_name: i.supplier_product_name || i.product_name,
          quantity: i.quantity,
          price: i.price,
          sku: i.supplier_sku ?? undefined,
        })),
        subject,
      })
      if (result.ok) {
        await admin.from('order_supplier_submissions').upsert(
          { order_id: orderId, supplier_id: supplierId, method },
          { onConflict: 'order_id,supplier_id' }
        )
        submitted++
      }
    }
  }

  return NextResponse.json({ ok: true, submitted })
}
