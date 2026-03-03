import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getAdminContext, requireAdmin } from '@/lib/admin-auth'
import { createMolliePayment } from '@/lib/mollie'
import { sendOrderReceivedEmail } from '@/lib/send-order-email'

/** POST – Freigabe erteilen, Mollie-Payment erstellen, E-Mail mit Zahlungslink */
export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })
  if (!hasSupabaseAdmin()) return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })

  const { id } = await Promise.resolve(context.params)
  if (!id) return NextResponse.json({ error: 'ID erforderlich' }, { status: 400 })

  const admin = createSupabaseAdmin()

  const { data: approval, error: appErr } = await admin
    .schema('b2b')
    .from('order_approvals')
    .select('approval_id, order_id, b2b_account_id, status')
    .eq('approval_id', id)
    .single()

  if (appErr || !approval || approval.status !== 'PENDING') {
    return NextResponse.json({ error: 'Freigabe nicht gefunden oder bereits bearbeitet' }, { status: 404 })
  }

  const { data: order } = await admin.from('orders').select('order_number, total, customer_email, customer_name, shipping_address, subtotal, shipping_cost, has_adult_items').eq('id', approval.order_id).single()
  if (!order) return NextResponse.json({ error: 'Bestellung nicht gefunden' }, { status: 404 })

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const isLocalhost = /localhost|127\.0\.0\.1/.test(baseUrl)
  const webhookUrl = process.env.MOLLIE_WEBHOOK_URL || (isLocalhost ? undefined : `${baseUrl}/api/payment/webhook`)

  if (!process.env.MOLLIE_API_KEY?.trim()) {
    return NextResponse.json({ error: 'Mollie nicht konfiguriert' }, { status: 500 })
  }

  const payment = await createMolliePayment({
    orderNumber: order.order_number,
    amount: Number(order.total),
    description: `Bestellung #${order.order_number} - Premium Headshop`,
    redirectUrl: `${baseUrl}/payment/success?order=${order.order_number}`,
    ...(webhookUrl && { webhookUrl }),
  })

  await admin.from('orders').update({
    mollie_payment_id: payment.paymentId,
    status: 'pending',
  }).eq('id', approval.order_id)

  await admin.schema('b2b').from('order_approvals').update({
    status: 'APPROVED',
    reviewed_by_admin_id: (await getAdminContext()).user?.id ?? null,
    reviewed_at: new Date().toISOString(),
  }).eq('approval_id', id)

  sendOrderReceivedEmail({
    orderNumber: order.order_number,
    customerName: order.customer_name ?? '',
    customerEmail: order.customer_email ?? '',
    items: [],
    subtotal: Number(order.subtotal),
    shipping: Number(order.shipping_cost),
    total: Number(order.total),
    shippingAddress: (order.shipping_address as Record<string, string>) ?? {},
    hasAdultItems: Boolean(order.has_adult_items),
  }).catch((e) => console.error('Approval: OrderReceived email failed', e))

  return NextResponse.json({
    ok: true,
    checkoutUrl: payment.checkoutUrl,
    message: 'Freigabe erteilt. Kunde erhält E-Mail mit Zahlungslink.',
  })
}
