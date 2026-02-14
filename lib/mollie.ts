import { createMollieClient } from '@mollie/api-client'

/**
 * Mollie Client für Payment-Integration
 */
export const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY || '',
})

/**
 * Erstelle eine Mollie-Zahlung
 */
export async function createMolliePayment(orderData: {
  orderNumber: string
  amount: number
  description: string
  redirectUrl: string
  webhookUrl?: string
}) {
  try {
    const payment = await mollieClient.payments.create({
      amount: {
        currency: 'EUR',
        value: orderData.amount.toFixed(2),
      },
      description: orderData.description,
      redirectUrl: orderData.redirectUrl,
      webhookUrl: orderData.webhookUrl,
      metadata: {
        order_number: orderData.orderNumber,
      },
    })

    return {
      paymentId: payment.id,
      checkoutUrl: payment.getCheckoutUrl(),
      status: payment.status,
    }
  } catch (error) {
    console.error('Mollie payment error:', error)
    throw error
  }
}

/**
 * Prüfe Zahlungsstatus (inkl. Metadata für order_number)
 */
export async function getMolliePaymentStatus(paymentId: string) {
  try {
    const payment = await mollieClient.payments.get(paymentId)
    const metadata = (payment as { metadata?: { order_number?: string } }).metadata
    const orderNumber = metadata?.order_number ?? null

    return {
      status: payment.status,
      isPaid: payment.status === 'paid',
      isCanceled: payment.status === 'canceled',
      isExpired: payment.status === 'expired',
      amount: payment.amount?.value ?? 0,
      orderNumber,
    }
  } catch (error) {
    console.error('Get payment status error:', error)
    throw error
  }
}
