import { createMollieClient } from '@mollie/api-client'

/**
 * Mollie Client für Payment-Integration
 */
export const mollieClient = createMollieClient({
  apiKey: process.env.MOLLIE_API_KEY || '',
})

/** Mollie Split-Route (Phase 3.3) */
export interface MollieSplitRoute {
  mollie_organization_id: string
  amount_eur: number
}

/**
 * Erstelle eine Mollie-Zahlung (optional mit Split-Routing für Multi-Vendor)
 */
export async function createMolliePayment(orderData: {
  orderNumber: string
  amount: number
  description: string
  redirectUrl: string
  webhookUrl?: string
  /** Mollie Split: Anteile an Vendoren routen (Phase 3.3); nur wenn bei Mollie aktiviert */
  splitRoutes?: MollieSplitRoute[]
  /** Blueprint Split Payment: split_id + participant_id für Webhook */
  splitId?: string
  participantId?: string
}) {
  try {
    const metadata: Record<string, string> = { order_number: orderData.orderNumber }
    if (orderData.splitId) metadata.split_id = orderData.splitId
    if (orderData.participantId) metadata.participant_id = orderData.participantId

    const payload: Record<string, unknown> = {
      amount: {
        currency: 'EUR',
        value: orderData.amount.toFixed(2),
      },
      description: orderData.description,
      redirectUrl: orderData.redirectUrl,
      webhookUrl: orderData.webhookUrl,
      metadata,
    }

    if (
      orderData.splitRoutes &&
      orderData.splitRoutes.length > 0 &&
      process.env.MOLLIE_SPLIT_ENABLED === 'true'
    ) {
      ;(payload as { routing?: unknown[] }).routing = orderData.splitRoutes.map((r) => ({
        amount: { currency: 'EUR', value: r.amount_eur.toFixed(2) },
        destination: { type: 'organization', organizationId: r.mollie_organization_id },
      }))
    }

    const payment = await mollieClient.payments.create(payload as unknown as Parameters<typeof mollieClient.payments.create>[0])

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
    const metadata = (payment as { metadata?: { order_number?: string; split_id?: string; participant_id?: string } }).metadata ?? {}
    const orderNumber = metadata?.order_number ?? null
    const splitId = metadata?.split_id ?? null
    const participantId = metadata?.participant_id ?? null

    return {
      status: payment.status,
      isPaid: payment.status === 'paid',
      isCanceled: payment.status === 'canceled',
      isExpired: payment.status === 'expired',
      amount: payment.amount?.value ?? 0,
      orderNumber,
      splitId,
      participantId,
    }
  } catch (error) {
    console.error('Get payment status error:', error)
    throw error
  }
}

/**
 * Erstelle eine Mollie-Erstattung für eine bestehende Zahlung.
 * @returns { refundId, status } oder wirft bei Fehler
 */
export async function createMollieRefund(params: {
  paymentId: string
  amountEur: number
  description?: string
}) {
  const refund = await mollieClient.paymentRefunds.create({
    paymentId: params.paymentId,
    amount: {
      currency: 'EUR',
      value: params.amountEur.toFixed(2),
    },
    description: params.description ?? `Erstattung ${params.amountEur.toFixed(2)} €`,
  })
  return {
    refundId: refund.id,
    status: refund.status,
  }
}

/**
 * Finde Payment-ID anhand der Bestellnummer (z. B. für Sync wenn mollie_payment_id nicht gespeichert ist)
 */
export async function findPaymentIdByOrderNumber(orderNumber: string): Promise<string | null> {
  try {
    const page = await mollieClient.payments.page({ limit: 50 })
    for (const payment of page) {
      const meta = (payment as { metadata?: { order_number?: string } }).metadata
      if (meta?.order_number === orderNumber) return payment.id
    }
    return null
  } catch (error) {
    console.error('Find payment by order number error', error)
    return null
  }
}
