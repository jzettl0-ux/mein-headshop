import { Resend } from 'resend'
import { renderOrderConfirmationEmail } from '@/components/emails/OrderConfirmation'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const FROM = process.env.RESEND_FROM_EMAIL || 'Headshop <onboarding@resend.dev>'

export interface OrderEmailPayload {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  shipping: number
  total: number
  shippingAddress: { street?: string; house_number?: string; postal_code?: string; city?: string }
  hasAdultItems: boolean
  /** Wenn gesetzt: Link zur Rechnung im Kundenbereich in die E-Mail einbauen */
  accountOrdersUrl?: string
}

/**
 * Sendet die Bestellbestätigungs-E-Mail (mit Resend, falls RESEND_API_KEY gesetzt).
 */
export async function sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – E-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const html = await renderOrderConfirmationEmail({
    orderNumber: payload.orderNumber,
    customerName: payload.customerName,
    items: payload.items,
    subtotal: payload.subtotal,
    shipping: payload.shipping,
    total: payload.total,
    shippingAddress: {
      street: payload.shippingAddress?.street ?? '',
      house_number: payload.shippingAddress?.house_number ?? '',
      postal_code: payload.shippingAddress?.postal_code ?? '',
      city: payload.shippingAddress?.city ?? '',
    },
    hasAdultItems: payload.hasAdultItems,
    accountOrdersUrl: payload.accountOrdersUrl,
  })

  try {
    const { data, error } = await resend.emails.send({
      from: FROM,
      to: payload.customerEmail,
      subject: `Bestellbestätigung #${payload.orderNumber} – Premium Headshop`,
      html,
    })
    if (error) {
      console.error('[Email] Resend error:', error)
      return { ok: false, error: error.message }
    }
    console.log('[Email] Bestellbestätigung gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: any) {
    console.error('[Email] Send failed:', e)
    return { ok: false, error: e?.message ?? 'Unknown error' }
  }
}
