import { NextRequest, NextResponse } from 'next/server'
import { createMolliePayment } from '@/lib/mollie'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderNumber, amount, customerEmail } = body

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const payment = await createMolliePayment({
      orderNumber,
      amount,
      description: `Bestellung #${orderNumber} - Premium Headshop`,
      redirectUrl: `${baseUrl}/payment/success?order=${orderNumber}`,
      webhookUrl: `${baseUrl}/api/payment/webhook`,
    })

    return NextResponse.json({
      success: true,
      checkoutUrl: payment.checkoutUrl,
      paymentId: payment.paymentId,
    })
  } catch (error: any) {
    console.error('Payment creation error:', error)
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    )
  }
}
