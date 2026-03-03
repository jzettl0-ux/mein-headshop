/**
 * POST – Betroffene Kunden eines Rückrufs per E-Mail benachrichtigen
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAdminContext } from '@/lib/admin-auth'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { sendProductRecallNotificationEmail } from '@/lib/send-order-email'

export const dynamic = 'force-dynamic'

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const { isOwner } = await getAdminContext()
  if (!isOwner) return NextResponse.json({ error: 'Nur Inhaber' }, { status: 403 })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })

  const { id: recallId } = await Promise.resolve(context.params)
  const admin = createSupabaseAdmin()

  const { data: recall, error: recallErr } = await admin
    .schema('compliance')
    .from('product_recalls')
    .select('*')
    .eq('recall_id', recallId)
    .single()

  if (recallErr || !recall) {
    return NextResponse.json({ error: 'Rückruf nicht gefunden' }, { status: 404 })
  }

  if (!recall.is_active) {
    return NextResponse.json({ error: 'Rückruf ist inaktiv' }, { status: 400 })
  }

  const productId = recall.product_id
  const asin = recall.asin

  if (!productId && !asin) {
    return NextResponse.json({ error: 'Rückruf ohne Produkt- oder ASIN-Bezug – keine Kunden zuzuordnen' }, { status: 400 })
  }

  let productIds: string[] = []
  if (productId) {
    productIds = [productId]
  } else if (asin) {
    const { data: prodRows } = await admin.from('products').select('id').eq('asin', asin)
    productIds = (prodRows ?? []).map((p: { id: string }) => p.id)
  }

  if (productIds.length === 0) {
    return NextResponse.json({ message: 'Keine betroffenen Produkte/Bestellungen gefunden', sent: 0 })
  }

  const { data: items } = await admin
    .from('order_items')
    .select('id, order_id, product_id, product_name')
    .in('product_id', productIds)
  if (!items?.length) {
    return NextResponse.json({ message: 'Keine betroffenen Bestellungen gefunden', sent: 0 })
  }

  const orderIds = [...new Set(items.map((i: { order_id: string }) => i.order_id))]
  const { data: orders } = await admin
    .from('orders')
    .select('id, customer_email, customer_name, user_id')
    .in('id', orderIds)

  if (!orders?.length) {
    return NextResponse.json({ message: 'Keine Bestellungen geladen', sent: 0 })
  }

  const productName = items[0]?.product_name ?? undefined
  const alreadyNotified = new Set<string>()
  const { data: existing } = await admin
    .schema('compliance')
    .from('recall_customer_notifications')
    .select('order_id')
    .eq('recall_id', recallId)
    .not('email_sent_at', 'is', null)

  for (const n of existing ?? []) {
    alreadyNotified.add(n.order_id)
  }

  let sent = 0
  const notifications: { order_id: string; order_item_id: string; customer_id: string | null; customer_email: string }[] = []

  for (const order of orders as { id: string; customer_email: string; customer_name: string; user_id: string | null }[]) {
    if (alreadyNotified.has(order.id)) continue

    const result = await sendProductRecallNotificationEmail({
      customerEmail: order.customer_email,
      customerName: order.customer_name || 'Kunde',
      recallReason: recall.recall_reason,
      productName,
      actionRequired: recall.action_required ?? undefined,
      publicAnnouncementUrl: recall.public_announcement_url ?? undefined,
      regulatoryAuthority: recall.regulatory_authority ?? undefined,
    })

    if (result.ok) {
      sent++
      const matchingItem = items.find((i: { order_id: string }) => i.order_id === order.id)
      notifications.push({
        order_id: order.id,
        order_item_id: matchingItem?.id ?? '',
        customer_id: order.user_id,
        customer_email: order.customer_email,
      })
    }
  }

  for (const n of notifications) {
    try {
      await admin
        .schema('compliance')
        .from('recall_customer_notifications')
        .insert({
          recall_id: recallId,
          order_id: n.order_id,
          order_item_id: n.order_item_id || null,
          customer_id: n.customer_id || null,
          customer_email: n.customer_email,
          email_sent_at: new Date().toISOString(),
        })
    } catch {
      // Doppelte Einträge ignorieren (bereits benachrichtigt)
    }
  }

  return NextResponse.json({ sent, total: orders.length })
}
