import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { generateOrderConfirmationEmail } from '@/lib/email-templates'

/**
 * API Route für Email-Versand nach Bestellung
 * TODO: Integriere mit Resend, SendGrid oder Supabase Edge Functions
 */
export async function POST(request: NextRequest) {
  try {
    const { orderNumber } = await request.json()

    // Hole Bestellung aus DB
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('order_number', orderNumber)
      .single()

    if (orderError || !order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      )
    }

    // Hole Bestellpositionen
    const { data: items } = await supabase
      .from('order_items')
      .select('*')
      .eq('order_id', order.id)

    // Generiere Email-HTML
    const emailHtml = generateOrderConfirmationEmail({
      orderNumber: order.order_number,
      customerName: order.customer_name,
      customerEmail: order.customer_email,
      items: items?.map(item => ({
        name: item.product_name,
        quantity: item.quantity,
        price: item.price,
      })) || [],
      subtotal: order.subtotal,
      shipping: order.shipping_cost,
      total: order.total,
      shippingAddress: order.shipping_address,
      hasAdultItems: order.has_adult_items,
    })

    // TODO: Versende Email mit Resend/SendGrid
    // Beispiel mit Resend:
    /*
    const { data, error } = await resend.emails.send({
      from: 'Premium Headshop <noreply@premium-headshop.de>',
      to: order.customer_email,
      subject: `Bestellbestätigung #${order.order_number}`,
      html: emailHtml,
    })
    */

    // Für Development: Log Email in Console
    console.log('📧 Email würde versendet an:', order.customer_email)
    console.log('Bestellnummer:', order.order_number)

    return NextResponse.json({
      success: true,
      message: 'Email-Versand vorbereitet (Development-Modus)',
      orderNumber: order.order_number,
    })
  } catch (error: any) {
    console.error('Email send error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
