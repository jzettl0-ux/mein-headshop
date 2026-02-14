import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { createMolliePayment } from '@/lib/mollie'

const IDENT_CHECK_FEE = 2.0
const BASE_SHIPPING = 4.9

/**
 * POST /api/checkout
 * Erstellt Bestellung in Supabase, dann Mollie-Payment.
 * Gesamtbetrag inkl. 2,00 € Ident-Check bei 18+ ist bereits im Frontend berechnet (getShipping).
 * Gibt checkoutUrl zurück → Frontend leitet zu Mollie weiter.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderNumber,
      user_id,
      customer_email,
      customer_name,
      shipping_address,
      billing_address,
      items,
      has_adult_items,
      discount_code,
      discount_amount,
    } = body

    if (!orderNumber || !customer_email || !customer_name || !shipping_address || !items?.length) {
      return NextResponse.json(
        { success: false, error: 'Fehlende Pflichtfelder' },
        { status: 400 }
      )
    }

    const supabase = await createServerSupabase()

    // Beträge aus Request (Frontend hat bereits subtotal, shipping inkl. Ident-Check, discount berechnet)
    const subtotal = Number(body.subtotal) ?? 0
    const shipping_cost = Number(body.shipping_cost) ?? BASE_SHIPPING + (has_adult_items ? IDENT_CHECK_FEE : 0)
    const discountAmount = Number(discount_amount) ?? 0
    const total = Math.max(0, subtotal + shipping_cost - discountAmount)

    const orderPayload = {
      order_number: orderNumber,
      user_id: user_id ?? null,
      customer_email: String(customer_email).trim(),
      customer_name: String(customer_name).trim(),
      shipping_address,
      billing_address: billing_address ?? shipping_address,
      subtotal,
      shipping_cost,
      total,
      status: 'pending',
      has_adult_items: Boolean(has_adult_items),
      payment_method: 'mollie',
      payment_status: 'pending',
      discount_code: discount_code ?? null,
      discount_amount: discountAmount,
    }

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert(orderPayload as never)
      .select()
      .single()

    if (orderError) {
      console.error('Order insert error:', orderError)
      return NextResponse.json(
        { success: false, error: orderError.message },
        { status: 500 }
      )
    }

    const order = orderData as { id: string }

    const orderItems = items.map((item: { product_id: string; product_name: string; product_image?: string; quantity: number; price: number }) => ({
      order_id: order.id,
      product_id: item.product_id,
      product_name: item.product_name,
      product_image: item.product_image ?? null,
      quantity: item.quantity,
      price: item.price,
      total: item.price * item.quantity,
    }))

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItems as never)

    if (itemsError) {
      console.error('Order items insert error:', itemsError)
      return NextResponse.json(
        { success: false, error: itemsError.message },
        { status: 500 }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const isLocalhost = /localhost|127\.0\.0\.1/.test(baseUrl)
    const webhookUrl =
      process.env.MOLLIE_WEBHOOK_URL ||
      (isLocalhost ? undefined : `${baseUrl}/api/payment/webhook`)

    const payment = await createMolliePayment({
      orderNumber,
      amount: total,
      description: `Bestellung #${orderNumber} - Premium Headshop`,
      redirectUrl: `${baseUrl}/payment/success?order=${orderNumber}`,
      ...(webhookUrl && { webhookUrl }),
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: payment.checkoutUrl,
      paymentId: payment.paymentId,
      orderNumber,
    })
  } catch (error: any) {
    console.error('Checkout API error:', error)
    return NextResponse.json(
      { success: false, error: error.message || 'Checkout fehlgeschlagen' },
      { status: 500 }
    )
  }
}
