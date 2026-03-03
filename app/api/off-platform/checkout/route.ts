/**
 * POST /api/off-platform/checkout
 * Off-Platform-Checkout: Widget erstellt Bestellung, Verknüpfung in off_platform_orders.
 * Header: x-widget-api-key (oder Body apiKey). Referer muss in domain_whitelist stehen.
 * Body: { apiKey?, items: [{ product_id, quantity }], customer_email, customer_name, shipping_address, billing_address?, external_session_id? }
 */
import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const BASE_SHIPPING = 4.9
const FREE_SHIPPING_THRESHOLD = 50

function generateOrderNumber(): string {
  return `OP-${Date.now()}-${Math.random().toString(36).slice(2, 10).toUpperCase()}`
}

export async function POST(request: NextRequest) {
  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Service nicht verfügbar' }, { status: 503 })
  }

  let body: {
    apiKey?: string
    items?: { product_id: string; quantity?: number }[]
    customer_email?: string
    customer_name?: string
    shipping_address?: Record<string, unknown>
    billing_address?: Record<string, unknown>
    external_session_id?: string
  }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Ungültiger JSON-Body' }, { status: 400 })
  }

  const apiKey = (request.headers.get('x-widget-api-key') || body.apiKey || '').trim()
  if (!apiKey) {
    return NextResponse.json({ error: 'x-widget-api-key oder body.apiKey erforderlich' }, { status: 400 })
  }

  const referer = request.headers.get('referer') ?? ''
  const host = referer ? (() => { try { return new URL(referer).host; } catch { return ''; } })() : ''

  const admin = createSupabaseAdmin()
  const { data: widget, error: widgetError } = await admin
    .schema('external_commerce')
    .from('widget_deployments')
    .select('widget_id, vendor_id, domain_whitelist, status')
    .eq('public_api_key', apiKey)
    .eq('status', 'ACTIVE')
    .maybeSingle()

  if (widgetError || !widget) {
    return NextResponse.json({ error: 'Ungültiger oder inaktiver API-Key' }, { status: 401 })
  }

  const allowedDomains = (widget.domain_whitelist || '').split(',').map((d: string) => d.trim().toLowerCase()).filter(Boolean)
  const allowed = host && allowedDomains.some((d: string) => host === d || host.endsWith('.' + d))
  if (!allowed) {
    return NextResponse.json({ error: 'Domain nicht in Whitelist' }, { status: 403 })
  }

  const items = Array.isArray(body.items) ? body.items : []
  const customer_email = typeof body.customer_email === 'string' ? body.customer_email.trim() : ''
  const customer_name = typeof body.customer_name === 'string' ? body.customer_name.trim() : ''
  const shipping_address = body.shipping_address && typeof body.shipping_address === 'object' ? body.shipping_address : null
  const billing_address = body.billing_address && typeof body.billing_address === 'object' ? body.billing_address : shipping_address

  if (!items.length || !customer_email || !customer_name || !shipping_address) {
    return NextResponse.json(
      { error: 'items, customer_email, customer_name, shipping_address erforderlich' },
      { status: 400 }
    )
  }

  const productIds = [...new Set(items.map((i) => i.product_id).filter(Boolean))]
  const { data: products } = await admin.from('products').select('id, name, price, image_url').in('id', productIds)
  const productMap = new Map((products ?? []).map((p: { id: string; name: string; price: number; image_url?: string }) => [p.id, p]))

  let subtotal = 0
  const orderItems: { product_id: string; product_name: string; product_image: string | null; quantity: number; price: number; total: number }[] = []

  for (const item of items) {
    const product = productMap.get(item.product_id)
    if (!product) {
      return NextResponse.json({ error: `Produkt ${item.product_id} nicht gefunden` }, { status: 400 })
    }
    const quantity = Math.min(99, Math.max(1, Math.floor(Number(item.quantity) || 1)))
    const price = Number(product.price)
    const total = price * quantity
    subtotal += total
    orderItems.push({
      product_id: item.product_id,
      product_name: product.name,
      product_image: product.image_url ?? null,
      quantity,
      price,
      total,
    })
  }

  const shipping_cost = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : BASE_SHIPPING
  const total = subtotal + shipping_cost
  const order_number = generateOrderNumber()

  const orderPayload = {
    order_number,
    user_id: null,
    customer_email,
    customer_name,
    shipping_address,
    billing_address: billing_address ?? shipping_address,
    subtotal,
    shipping_cost,
    total,
    status: 'pending',
    has_adult_items: false,
    payment_method: 'mollie',
    payment_status: 'pending',
  }

  const { data: order, error: orderError } = await admin
    .from('orders')
    .insert(orderPayload as never)
    .select('id')
    .single()

  if (orderError || !order) {
    console.error('[off-platform/checkout] order insert:', orderError?.message)
    return NextResponse.json({ error: 'Bestellung konnte nicht erstellt werden' }, { status: 500 })
  }

  const orderId = (order as { id: string }).id
  for (const row of orderItems) {
    await admin.from('order_items').insert({
      order_id: orderId,
      product_id: row.product_id,
      product_name: row.product_name,
      product_image: row.product_image,
      quantity: row.quantity,
      price: row.price,
      total: row.total,
    })
  }

  const paymentFee = 0
  const fulfillmentFee = 0
  const { error: offError } = await admin
    .schema('external_commerce')
    .from('off_platform_orders')
    .insert({
      widget_id: widget.widget_id,
      internal_order_id: orderId,
      external_session_id: body.external_session_id ?? null,
      payment_fee_charged: paymentFee,
      fulfillment_fee_charged: fulfillmentFee,
    })

  if (offError) {
    console.error('[off-platform/checkout] off_platform_orders insert:', offError.message)
  }

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin
  const checkoutUrl = `${baseUrl}/checkout?order=${encodeURIComponent(order_number)}`

  return NextResponse.json({
    orderId,
    order_number: order_number,
    total,
    checkoutUrl,
  })
}
