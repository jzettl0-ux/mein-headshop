import { NextRequest, NextResponse } from 'next/server'
import { getMolliePaymentStatus } from '@/lib/mollie'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { generateInvoicePdf } from '@/lib/invoice-pdf'
import { sendOrderConfirmationEmail } from '@/lib/send-order-email'

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { id: paymentId } = body

    const paymentStatus = await getMolliePaymentStatus(paymentId)

    if (!paymentStatus.isPaid || !paymentStatus.orderNumber) {
      return NextResponse.json({ success: true })
    }

    const orderNumber = paymentStatus.orderNumber
    let invoiceUrl: string | null = null

    if (hasSupabaseAdmin()) {
      const admin = createSupabaseAdmin()

      const { data: order, error: orderError } = await admin
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .single()

      if (orderError || !order) {
        console.error('Webhook: Order not found', orderNumber, orderError)
        return NextResponse.json({ success: false, error: 'Order not found' }, { status: 404 })
      }

      const { data: items } = await admin
        .from('order_items')
        .select('*')
        .eq('order_id', order.id)

      const invoicePayload = {
        order_number: order.order_number,
        created_at: order.created_at,
        customer_name: order.customer_name,
        customer_email: order.customer_email,
        billing_address: order.billing_address || order.shipping_address || {},
        shipping_address: order.shipping_address,
        payment_method: order.payment_method || 'mollie',
        items: (items || []).map((i: any) => ({
          product_name: i.product_name,
          quantity: i.quantity,
          price: Number(i.price),
          total: Number(i.total),
        })),
        subtotal: Number(order.subtotal),
        shipping_cost: Number(order.shipping_cost),
        discount_amount: Number(order.discount_amount) || 0,
        total: Number(order.total),
        has_adult_items: order.has_adult_items,
      }

      const pdfBytes = await generateInvoicePdf(invoicePayload)
      const fileName = `rechnung-${orderNumber}.pdf`
      const { error: uploadError } = await admin.storage
        .from('invoices')
        .upload(fileName, pdfBytes, {
          contentType: 'application/pdf',
          upsert: true,
        })

      if (uploadError) {
        console.error('Webhook: Invoice upload failed', uploadError)
      } else {
        invoiceUrl = fileName
      }

      const { error: updateError } = await admin
        .from('orders')
        .update({
          payment_status: 'paid',
          status: 'processing',
          invoice_url: invoiceUrl,
        })
        .eq('order_number', orderNumber)

      if (updateError) {
        console.error('Webhook: Order update error', updateError)
      }

      await sendOrderConfirmationEmail({
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        items: (items || []).map((i: any) => ({
          name: i.product_name,
          quantity: i.quantity,
          price: Number(i.price),
        })),
        subtotal: Number(order.subtotal),
        shipping: Number(order.shipping_cost),
        total: Number(order.total),
        shippingAddress: order.shipping_address || {},
        hasAdultItems: Boolean(order.has_adult_items),
        accountOrdersUrl: `${BASE_URL}/account`,
      })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
