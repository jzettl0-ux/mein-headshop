import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { createMolliePayment } from '@/lib/mollie'
import { sendOrderReceivedEmail, sendSubscriptionPaymentLinkEmail } from '@/lib/send-order-email'

const BASE_SHIPPING = 4.9
const FREE_SHIPPING_THRESHOLD = 50
const IDENT_CHECK_FEE = 2.0

function generateOrderNumber(): string {
  const timestamp = Date.now().toString().slice(-8)
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0')
  return `SUB-${timestamp}-${random}`
}

/**
 * GET /api/cron/process-subscriptions?secret=CRON_SECRET
 * Verarbeitet fällige Subscribe-&-Save-Abos:
 * Erstellt Bestellung, Mollie-Payment, sendet Zahlungslink per E-Mail, setzt next_order_date.
 */
export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const secret = process.env.CRON_SECRET
  if (secret && searchParams.get('secret') !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Backend nicht konfiguriert' }, { status: 503 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const admin = createSupabaseAdmin()

  const { data: subs, error } = await admin
    .schema('cx')
    .from('subscriptions')
    .select('*, products(id, name, slug, price, image_url, is_adult_only)')
    .eq('status', 'ACTIVE')
    .lte('next_order_date', today)

  if (error || !subs?.length) {
    return NextResponse.json({ processed: 0, errors: [] })
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const webhookUrl = /localhost|127\.0\.0\.1/.test(baseUrl)
    ? undefined
    : `${baseUrl}/api/payment/webhook`

  const results: { subscription_id: string; order_id?: string; error?: string }[] = []

  for (const sub of subs) {
    const product = sub.products as { id: string; name: string; price: number; image_url?: string; is_adult_only?: boolean } | null
    if (!product) {
      results.push({ subscription_id: sub.subscription_id, error: 'Produkt nicht gefunden' })
      continue
    }

    const { data: user } = await admin.auth.admin.getUserById(sub.customer_id)
    if (!user?.user?.email) {
      results.push({ subscription_id: sub.subscription_id, error: 'Nutzer/E-Mail nicht gefunden' })
      continue
    }

    const { data: addr } = await admin
      .from('customer_addresses')
      .select('first_name, last_name, street, house_number, postal_code, city, country, phone')
      .eq('user_id', sub.customer_id)
      .eq('is_default', true)
      .limit(1)
      .maybeSingle()

    let shipping_address: Record<string, string> | null = null
    let customer_name = user.user.email

    if (addr) {
      shipping_address = {
        first_name: addr.first_name,
        last_name: addr.last_name,
        street: addr.street,
        house_number: addr.house_number,
        postal_code: addr.postal_code,
        city: addr.city,
        country: addr.country || 'Deutschland',
        phone: addr.phone,
      }
      customer_name = `${addr.first_name} ${addr.last_name}`
    } else {
      const { data: lastOrder } = await admin
        .from('orders')
        .select('shipping_address, customer_name')
        .eq('user_id', sub.customer_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (lastOrder?.shipping_address) {
        shipping_address = lastOrder.shipping_address as Record<string, string>
        customer_name = (lastOrder.customer_name as string) ?? customer_name
      }
    }

    if (!shipping_address) {
      results.push({ subscription_id: sub.subscription_id, error: 'Keine Lieferadresse' })
      continue
    }

    const qty = Math.max(1, sub.quantity ?? 1)
    const unitPrice = Number(product.price) ?? 0
    const discountPct = Number(sub.discount_percentage) ?? 5
    const subtotal = (unitPrice * qty * (100 - discountPct)) / 100
    const hasAdult = Boolean(product.is_adult_only)
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD
    const shipping_cost = (freeShipping ? 0 : BASE_SHIPPING) + (hasAdult ? IDENT_CHECK_FEE : 0)
    const total = Math.round((subtotal + shipping_cost) * 100) / 100

    const orderNumber = generateOrderNumber()
    const destCountry = (shipping_address as { country?: string })?.country === 'Österreich' ? 'AT' : 'DE'

    const orderPayload = {
      order_number: orderNumber,
      destination_country: destCountry,
      user_id: sub.customer_id,
      customer_email: user.user.email,
      customer_name,
      shipping_address,
      billing_address: shipping_address,
      subtotal,
      shipping_cost,
      total,
      status: 'pending',
      has_adult_items: hasAdult,
      payment_method: 'mollie',
      payment_status: 'pending',
      discount_code: 'SUBSCRIBE',
      discount_amount: unitPrice * qty - subtotal,
    }

    const { data: order, error: orderErr } = await admin.from('orders').insert(orderPayload).select('id').single()

    if (orderErr || !order) {
      results.push({ subscription_id: sub.subscription_id, error: orderErr?.message ?? 'Order insert failed' })
      continue
    }

    const orderItems = [
      {
        order_id: order.id,
        product_id: product.id,
        product_name: product.name,
        product_image: product.image_url ?? null,
        quantity: qty,
        price: unitPrice * (100 - discountPct) / 100,
        total: subtotal,
        vendor_id: null,
        offer_id: null,
        fulfillment_type: 'fbm',
        seller_type: 'shop',
        order_line_id: null,
      },
    ]

    const { error: itemsErr } = await admin.from('order_items').insert(orderItems)
    if (itemsErr) {
      results.push({ subscription_id: sub.subscription_id, error: itemsErr.message })
      continue
    }

    if (!process.env.MOLLIE_API_KEY?.trim()) {
      results.push({ subscription_id: sub.subscription_id, error: 'MOLLIE_API_KEY nicht gesetzt' })
      continue
    }

    try {
      const payment = await createMolliePayment({
        orderNumber,
        amount: total,
        description: `Abo #${orderNumber} - Premium Headshop`,
        redirectUrl: `${baseUrl}/payment/success?order=${orderNumber}`,
        ...(webhookUrl && { webhookUrl }),
      })

      await admin.from('orders').update({ mollie_payment_id: payment.paymentId }).eq('id', order.id)

      sendOrderReceivedEmail({
        orderNumber,
        customerName: customer_name,
        customerEmail: user.user.email,
        items: orderItems.map((i) => ({ name: i.product_name, quantity: i.quantity, price: i.price })),
        subtotal,
        shipping: shipping_cost,
        total,
        shippingAddress: shipping_address as { street?: string; house_number?: string; postal_code?: string; city?: string },
        hasAdultItems: hasAdult,
      }).catch((e) => console.error('[Cron] Subscription OrderReceived email failed', e))

      sendSubscriptionPaymentLinkEmail({
        customerName: customer_name,
        customerEmail: user.user.email,
        productName: product.name,
        quantity: qty,
        orderNumber,
        checkoutUrl: payment.checkoutUrl ?? '',
        total,
      }).catch((e) => console.error('[Cron] SubscriptionPaymentLink email failed', e))

      const nextDate = new Date(sub.next_order_date)
      nextDate.setDate(nextDate.getDate() + (sub.interval_days ?? 30))
      await admin
        .schema('cx')
        .from('subscriptions')
        .update({ next_order_date: nextDate.toISOString().slice(0, 10) })
        .eq('subscription_id', sub.subscription_id)

      results.push({ subscription_id: sub.subscription_id, order_id: order.id })
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      results.push({ subscription_id: sub.subscription_id, error: `Mollie: ${msg}` })
    }
  }

  return NextResponse.json({
    processed: results.filter((r) => !r.error).length,
    total: subs.length,
    results,
  })
}
