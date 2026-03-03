/**
 * Blueprint 3.3: Product Recall Management
 * GET – Liste aktiver Rückrufe
 * POST – Neuen Rückruf anlegen (nur Owner)
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  const { isAdmin } = await getAdminContext()
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('compliance')
    .from('product_recalls')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[admin/product-recalls]', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ recalls: data ?? [] })
}

export async function POST(req: NextRequest) {
  const { isOwner } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const body = await req.json().catch(() => ({}))
  const { product_id, asin, recall_reason, regulatory_authority, public_announcement_url, action_required } = body
  if (!recall_reason || typeof recall_reason !== 'string' || !recall_reason.trim()) {
    return NextResponse.json({ error: 'recall_reason erforderlich' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()
  const { data, error } = await admin
    .schema('compliance')
    .from('product_recalls')
    .insert({
      product_id: product_id || null,
      asin: asin || null,
      recall_reason: recall_reason.trim(),
      regulatory_authority: regulatory_authority || null,
      public_announcement_url: public_announcement_url || null,
      action_required: ['DESTROY', 'RETURN_TO_VENDOR', 'SOFTWARE_UPDATE'].includes(action_required) ? action_required : null,
      is_active: true,
    })
    .select()
    .single()

  if (error) {
    console.error('[admin/product-recalls] POST', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  // Kill-Switch: Produkt sofort sperren (Blueprint 3.3)
  let productIdsToDeactivate: string[] = []
  if (data?.product_id) {
    productIdsToDeactivate = [data.product_id]
  } else if (data?.asin) {
    const { data: prods } = await admin.from('products').select('id').eq('asin', data.asin)
    productIdsToDeactivate = (prods ?? []).map((p: { id: string }) => p.id)
  }
  if (productIdsToDeactivate.length > 0) {
    await admin
      .from('products')
      .update({ is_active: false })
      .in('id', productIdsToDeactivate)
  }

  // Logistik-Stopp: Bestellungen mit recalled Produkt stornieren (Blueprint 3.3)
  if (productIdsToDeactivate.length > 0) {
    const { data: affectedItems } = await admin
      .from('order_items')
      .select('order_id')
      .in('product_id', productIdsToDeactivate)
    const orderIds = [...new Set((affectedItems ?? []).map((i: { order_id: string }) => i.order_id))]
    if (orderIds.length > 0) {
      const { data: ordersToCancel } = await admin
        .from('orders')
        .select('id, status, payment_status')
        .in('id', orderIds)
        .in('status', ['pending', 'processing'])
      const toCancel = (ordersToCancel ?? []).filter((o) => o.status !== 'cancelled')
      for (const o of toCancel) {
        await admin.from('orders').update({ status: 'cancelled' }).eq('id', o.id)
        const wasPaid = (o as { payment_status?: string }).payment_status === 'paid'
        if (wasPaid) {
          try { await admin.rpc('increment_stock_for_order', { p_order_id: o.id }) } catch { /* ignore */ }
        }
      }
    }
  }

  return NextResponse.json(data)
}
