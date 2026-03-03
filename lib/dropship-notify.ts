import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendSupplierOrderEmail } from '@/lib/send-order-email'
import { MockInfluencerConnector } from '@/lib/connectors/mock-influencer'
import type { SupplierOrderPayload } from '@/lib/connectors/base'

/**
 * Nach Zahlungseingang: Bestellung nach Lieferanten gruppieren und
 * - type=email: Bestell-E-Mail an Lieferant (Resend)
 * - type=api: Bestelldaten per MockInfluencerConnector an api_endpoint senden
 * Einträge in order_supplier_submissions protokollieren.
 */
export async function notifySuppliersForOrder(orderId: string): Promise<{ ok: boolean; error?: string }> {
  if (!hasSupabaseAdmin()) return { ok: false, error: 'Supabase Admin nicht verfügbar' }
  const admin = createSupabaseAdmin()

  const { data: order, error: orderErr } = await admin.from('orders').select('*').eq('id', orderId).single()
  if (orderErr || !order) return { ok: false, error: 'Bestellung nicht gefunden' }

  const { data: items, error: itemsErr } = await admin
    .from('order_items')
    .select('id, product_id, product_name, quantity, price, total')
    .eq('order_id', orderId)
  if (itemsErr) return { ok: false, error: itemsErr.message }

  const productIds = [...new Set((items || []).map((i: { product_id?: string }) => i.product_id).filter(Boolean))] as string[]
  let productSupplierMap: Record<string, string> = {}
  if (productIds.length > 0) {
    const { data: products } = await admin.from('products').select('id, supplier_id').in('id', productIds)
    for (const p of products || []) {
      if (p?.supplier_id) productSupplierMap[p.id] = p.supplier_id
    }
  }

  // Gruppierung: supplier_id -> { supplier, items[] }
  const bySupplier = new Map<string, { itemRows: { product_name: string; quantity: number; price: number }[] }>()
  for (const row of items || []) {
    const supplierId = row.product_id ? productSupplierMap[row.product_id] : null
    if (!supplierId) continue
    const entry = bySupplier.get(supplierId) ?? { itemRows: [] }
    entry.itemRows.push({
      product_name: row.product_name ?? 'Artikel',
      quantity: Number(row.quantity) || 1,
      price: Number(row.price) ?? 0,
    })
    bySupplier.set(supplierId, entry)
  }

  if (bySupplier.size === 0) return { ok: true }

  const { data: suppliers } = await admin.from('suppliers').select('id, name, contact_email, type, api_endpoint, api_key').in('id', [...bySupplier.keys()])
  const supplierById = new Map((suppliers || []).map((s) => [s.id, s]))

  const shippingAddress = (order.shipping_address as Record<string, unknown>) || {}
  const orderPayload: SupplierOrderPayload = {
    order_number: order.order_number,
    customer_name: order.customer_name ?? '',
    shipping_address: {
      street: shippingAddress.street as string | undefined,
      house_number: shippingAddress.house_number as string | undefined,
      postal_code: shippingAddress.postal_code as string | undefined,
      city: shippingAddress.city as string | undefined,
      country: shippingAddress.country as string | undefined,
    },
    items: (items || []).map((i: { product_name: string; quantity: number; price: number }) => ({
      product_name: i.product_name ?? 'Artikel',
      quantity: Number(i.quantity) || 1,
      price: Number(i.price) ?? 0,
    })),
  }

  const { data: existingSubmissions } = await admin
    .from('order_supplier_submissions')
    .select('supplier_id')
    .eq('order_id', orderId)
  const alreadySubmitted = new Set((existingSubmissions || []).map((s: { supplier_id: string }) => s.supplier_id))

  const connector = new MockInfluencerConnector()

  for (const [supplierId, { itemRows }] of bySupplier) {
    if (alreadySubmitted.has(supplierId)) continue
    const supplier = supplierById.get(supplierId)
    if (!supplier) continue
    if (supplier.type === 'manual') continue

    const method = supplier.type === 'api' ? 'api' : 'email'
    let success = false

    if (supplier.type === 'api') {
      const payloadForSupplier: SupplierOrderPayload = {
        ...orderPayload,
        items: itemRows,
      }
      const result = connector.submitOrder
        ? await connector.submitOrder(
            { api_endpoint: supplier.api_endpoint ?? '', api_key: supplier.api_key },
            payloadForSupplier
          )
        : { ok: false, error: 'submitOrder nicht verfügbar' }
      success = result.ok
      if (!result.ok) console.error('[Dropship] API Lieferant', supplier.name, result.error)
    } else {
      const to = supplier.contact_email?.trim()
      if (!to) {
        console.warn('[Dropship] Lieferant ohne E-Mail:', supplier.name)
        continue
      }
      const result = await sendSupplierOrderEmail({
        to,
        orderNumber: order.order_number,
        customerName: order.customer_name ?? '',
        shippingAddress: orderPayload.shipping_address,
        items: itemRows,
      })
      success = result.ok
      if (!result.ok) console.error('[Dropship] E-Mail Lieferant', supplier.name, result.error)
    }

    if (success) {
      await admin.from('order_supplier_submissions').upsert(
        { order_id: orderId, supplier_id: supplierId, method },
        { onConflict: 'order_id,supplier_id' }
      )
    }
  }

  return { ok: true }
}
