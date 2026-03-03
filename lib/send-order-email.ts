import { Resend } from 'resend'
import { renderOrderConfirmationEmail } from '@/components/emails/OrderConfirmation'
import { renderOrderReceivedEmail } from '@/components/emails/OrderReceived'
import { renderSubscriptionPaymentLinkEmail } from '@/components/emails/SubscriptionPaymentLink'
import { renderShippingNotificationEmail } from '@/components/emails/ShippingNotification'
import { renderReviewRequestEmail } from '@/components/emails/ReviewRequestEmail'
import { renderReferralSuccessEmail } from '@/components/emails/ReferralSuccessEmail'
import { renderNewsletterDiscountCodeEmail } from '@/components/emails/NewsletterDiscountCode'
import { renderDropRadarRestockEmail } from '@/components/emails/DropRadarRestock'
import { getTrackingUrlForCarrier } from './shipping-settings'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { getResendFrom } from '@/lib/resend-from'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

async function getEmailLogoUrl(): Promise<string | undefined> {
  if (!hasSupabaseAdmin()) return undefined
  try {
    const admin = createSupabaseAdmin()
    const { data } = await admin.from('site_settings').select('value').eq('key', 'logo_url').maybeSingle()
    const url = data?.value?.trim()
    return url ? String(url) : undefined
  } catch {
    return undefined
  }
}

export interface OrderReceivedPayload {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{ name: string; quantity: number; price: number }>
  subtotal: number
  shipping: number
  total: number
  shippingAddress: { street?: string; house_number?: string; postal_code?: string; city?: string }
  hasAdultItems: boolean
}

/**
 * Sendet sofort nach Bestellabschluss (vor Zahlung): „Bestellung eingegangen“,
 * mit Hinweis auf Prüfung des Zahlungseingangs und weitere E-Mails.
 */
export async function sendOrderReceivedEmail(payload: OrderReceivedPayload): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Auftragsbestätigung wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const logoUrl = await getEmailLogoUrl()
  const html = await renderOrderReceivedEmail({
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
    logoUrl,
  })

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Bestellung #${payload.orderNumber} eingegangen – Premium Headshop`,
      html,
    })
    if (error) {
      console.error('[Email] OrderReceived error:', error)
      return { ok: false, error: error.message }
    }
    console.log('[Email] Auftragsbestätigung gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] OrderReceived failed:', err)
    return { ok: false, error: err.message }
  }
}

export interface OrderEmailPayload {
  orderNumber: string
  customerName: string
  customerEmail: string
  items: Array<{ name: string; quantity: number; price: number; product_slug?: string; product_image?: string }>
  subtotal: number
  shipping: number
  total: number
  shippingAddress: { street?: string; house_number?: string; postal_code?: string; city?: string }
  hasAdultItems: boolean
  /** Wenn gesetzt: Link zur Rechnung im Kundenbereich in die E-Mail einbauen */
  accountOrdersUrl?: string
  /** Rechnung als PDF-Anhang mitsenden (bei Zahlungsbestätigung) */
  invoicePdfBytes?: Uint8Array | Buffer
  invoicePdfFileName?: string
}

/**
 * Sendet die Bestellbestätigungs-E-Mail (mit Resend, falls RESEND_API_KEY gesetzt).
 */
export async function sendOrderConfirmationEmail(payload: OrderEmailPayload): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – E-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const hasPdfAttachment = Boolean(payload.invoicePdfBytes && payload.invoicePdfFileName)
  const logoUrl = await getEmailLogoUrl()

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
    attachInvoice: hasPdfAttachment,
    logoUrl,
  })

  const attachments = hasPdfAttachment && payload.invoicePdfBytes && payload.invoicePdfFileName
    ? [{
        filename: payload.invoicePdfFileName,
        content: Buffer.isBuffer(payload.invoicePdfBytes) ? payload.invoicePdfBytes : Buffer.from(payload.invoicePdfBytes),
      }]
    : undefined

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Bestellbestätigung #${payload.orderNumber} – Premium Headshop`,
      html,
      ...(attachments && attachments.length > 0 ? { attachments } : {}),
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

export interface ShippingNotificationShipment {
  trackingNumber: string
  trackingCarrier?: string
}

export interface ShippingNotificationItem {
  name: string
  quantity: number
  price: number
  product_image?: string
}

export interface ShippingNotificationPayload {
  orderNumber: string
  customerName: string
  customerEmail: string
  /** Eine oder mehrere Sendungen – alle in einer E-Mail */
  shipments: ShippingNotificationShipment[]
  /** Bestellte Artikel (für Kontext in der E-Mail) */
  items?: ShippingNotificationItem[]
  subtotal?: number
  shipping?: number
  total?: number
}

/**
 * Sendet eine Versandbenachrichtigung mit allen angegebenen Sendungsnummern in einer E-Mail.
 */
export async function sendShippingNotificationEmail(payload: ShippingNotificationPayload): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Versandmail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  if (payload.shipments.length === 0) {
    return { ok: false, error: 'Mindestens eine Sendung erforderlich' }
  }

  const logoUrl = await getEmailLogoUrl()
  const shipmentsWithUrls = await Promise.all(
    payload.shipments.map(async (s) => ({
      trackingNumber: s.trackingNumber,
      trackingCarrier: s.trackingCarrier || 'DHL',
      trackingUrl: await getTrackingUrlForCarrier(s.trackingCarrier || 'DHL', s.trackingNumber),
    }))
  )

  const html = await renderShippingNotificationEmail({
    orderNumber: payload.orderNumber,
    customerName: payload.customerName,
    shipments: shipmentsWithUrls,
    items: payload.items,
    subtotal: payload.subtotal,
    shipping: payload.shipping,
    total: payload.total,
    accountOrdersUrl: `${BASE_URL}/account`,
    logoUrl,
  })

  const subject =
    payload.shipments.length > 1
      ? `Deine Pakete sind unterwegs – Sendungsverfolgung #${payload.orderNumber}`
      : `Dein Paket ist unterwegs – Sendungsverfolgung #${payload.orderNumber}`

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject,
      html,
    })
    if (error) {
      console.error('[Email] Versandbenachrichtigung Fehler:', error)
      return { ok: false, error: error.message }
    }
    console.log('[Email] Versandbenachrichtigung gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: any) {
    console.error('[Email] Versandmail fehlgeschlagen:', e)
    return { ok: false, error: e?.message ?? 'Unknown error' }
  }
}

/** Einheitliche Shop-E-Mail-Farben – helles Design (theme-light), gleicher Look wie der Shop. */
const SHOP_EMAIL_STYLES = {
  bg: '#FDFBF5',
  card: '#FFFFFF',
  border: '#e5e5e5',
  text: '#262626',
  muted: '#525252',
  gold: '#2D5A2D',
  goldLight: '#3D8B3D',
  headerBg: '#F5F5F5',
}

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'

/**
 * Einheitliches E-Mail-Layout: gleicher Aufbau für alle Kunden-Mails (Logo, Header, Inhalt, Footer).
 * Verwendet Shop-Look (dunkel, Gold-Gradient) und immer das Logo aus site_settings.
 */
function renderShopEmailLayout(params: {
  pageTitle: string
  bodyContent: string
  logoUrl?: string
}): string {
  const { pageTitle, bodyContent, logoUrl } = params
  const headerBlock = `
      <div style="background:${SHOP_EMAIL_STYLES.headerBg};padding:28px 24px;text-align:center;">
        ${logoUrl ? `<img src="${logoUrl}" alt="${SITE_NAME}" width="160" height="48" style="display:inline-block;max-height:48px;width:auto;object-fit:contain;" />` : `<span style="font-size:22px;font-weight:700;color:#262626;letter-spacing:0.02em;">${SITE_NAME}</span>`}
      </div>`
  const footerBlock = `
        <p style="margin:28px 0 0;font-size:15px;color:${SHOP_EMAIL_STYLES.gold};font-weight:600;">
          Dein Team von ${SITE_NAME}
        </p>`
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${pageTitle.replace(/</g, '&lt;')} – ${SITE_NAME}</title>
</head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:${SHOP_EMAIL_STYLES.bg};color:${SHOP_EMAIL_STYLES.text};padding:32px 16px;">
  <div style="max-width:520px;margin:0 auto;">
    <div style="background:${SHOP_EMAIL_STYLES.card};border:1px solid ${SHOP_EMAIL_STYLES.border};border-radius:16px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
      ${headerBlock}
      <div style="padding:32px 24px;">
        ${bodyContent}
        ${footerBlock}
      </div>
    </div>
  </div>
</body>
</html>
`.trim()
}

/** @deprecated Alias für Abwärtskompatibilität */
const SUPPORT_EMAIL_STYLES = SHOP_EMAIL_STYLES

/**
 * Sendet eine Kundenservice-Antwort im einheitlichen Shop-E-Mail-Layout (Logo, gleicher Aufbau).
 */
export async function sendSupportReplyEmail(payload: {
  to: string
  subject: string
  replyText: string
  inquirySubject?: string
  customerName?: string
  inquiryId?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Support-Antwort wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const name = payload.customerName?.trim() || 'du'
  const safeText = payload.replyText.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const bodyContent = `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${SHOP_EMAIL_STYLES.text};">
          Hi ${name} – hier ist unsere Antwort
        </h1>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.muted};">
          ${payload.inquirySubject ? `Zu deiner Anfrage „${payload.inquirySubject.replace(/</g, '&lt;')}"` : 'Zu deiner Anfrage'} haben wir uns gemeldet. Dein Anliegen liegt uns am Herzen – schau mal unten, was wir dir antworten möchten.
        </p>
        <div style="background:${SHOP_EMAIL_STYLES.bg};border:1px solid ${SHOP_EMAIL_STYLES.border};border-radius:12px;padding:20px;margin:24px 0;white-space:pre-wrap;font-size:15px;line-height:1.7;color:${SHOP_EMAIL_STYLES.text};">
${safeText}
        </div>
        <p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          Du hast noch Fragen? Einfach auf diese E-Mail antworten – deine Nachricht landet direkt bei uns und wir melden uns schnellstmöglich.
        </p>
  `.trim()
  const html = renderShopEmailLayout({ pageTitle: 'Antwort auf deine Anfrage', bodyContent, logoUrl })
  try {
    const from = getResendFrom()
    const inboundDomain = process.env.RESEND_INBOUND_DOMAIN?.trim()
    const replyPrefix = process.env.RESEND_INBOUND_REPLY_PREFIX?.trim() || 'reply'
    const replyTo =
      payload.inquiryId && inboundDomain
        ? `${replyPrefix}+${payload.inquiryId}@${inboundDomain}`
        : undefined
    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html,
      ...(replyTo && { reply_to: replyTo }),
    })
    if (error) {
      console.error('[Email] Support-Antwort Fehler:', error)
      const msg = toResendFriendlyError(error.message)
      return { ok: false, error: msg }
    }
    console.log('[Email] Support-Antwort gesendet an', payload.to, data?.id)
    return { ok: true }
  } catch (e: any) {
    console.error('[Email] Support-Antwort fehlgeschlagen:', e)
    const msg = toResendFriendlyError(e?.message ?? 'Unknown error')
    return { ok: false, error: msg }
  }
}

/**
 * Sendet Antwort auf Mitarbeiter-Beschwerde. Reply-To: beschwerde+{complaintId}@domain,
 * damit E-Mail-Antworten des Mitarbeiters per Inbound-Webhook im Chat erscheinen.
 */
export async function sendComplaintReplyEmail(payload: {
  to: string
  subject: string
  replyText: string
  complaintSubject?: string
  complaintId: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Beschwerde-Antwort wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const safeText = payload.replyText.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const bodyContent = `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${SHOP_EMAIL_STYLES.text};">
          Antwort auf deine Beschwerde
        </h1>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.muted};">
          ${payload.complaintSubject ? `Zu „${payload.complaintSubject.replace(/</g, '&lt;')}"` : 'Zu deiner Beschwerde'} haben wir uns gemeldet.
        </p>
        <div style="background:${SHOP_EMAIL_STYLES.bg};border:1px solid ${SHOP_EMAIL_STYLES.border};border-radius:12px;padding:20px;margin:24px 0;white-space:pre-wrap;font-size:15px;line-height:1.7;color:${SHOP_EMAIL_STYLES.text};">
${safeText}
        </div>
        <p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          Du kannst einfach auf diese E-Mail antworten – deine Nachricht erscheint im internen Beschwerde-Chat.
        </p>
  `.trim()
  const html = renderShopEmailLayout({ pageTitle: 'Antwort auf deine Beschwerde', bodyContent, logoUrl })
  try {
    const from = getResendFrom()
    const inboundDomain = process.env.RESEND_INBOUND_DOMAIN?.trim()
    const complaintPrefix = process.env.RESEND_INBOUND_COMPLAINT_PREFIX?.trim() || 'beschwerde'
    const replyTo =
      payload.complaintId && inboundDomain
        ? `${complaintPrefix}+${payload.complaintId}@${inboundDomain}`
        : undefined
    const { data, error } = await resend.emails.send({
      from,
      to: payload.to,
      subject: payload.subject,
      html,
      ...(replyTo && { reply_to: replyTo }),
    })
    if (error) {
      console.error('[Email] Beschwerde-Antwort Fehler:', error)
      const msg = toResendFriendlyError(error.message)
      return { ok: false, error: msg }
    }
    console.log('[Email] Beschwerde-Antwort gesendet an', payload.to, data?.id)
    return { ok: true }
  } catch (e: any) {
    console.error('[Email] Beschwerde-Antwort fehlgeschlagen:', e)
    const msg = toResendFriendlyError(e?.message ?? 'Unknown error')
    return { ok: false, error: msg }
  }
}

/**
 * Sendet E-Mail an Kunden, wenn Rücksendung angenommen wurde: Versandcode + Versanddienstleister/Preise.
 */
export async function sendReturnApprovedEmail(payload: {
  customerEmail: string
  customerName: string
  orderNumber: string
  returnShippingCode: string
  returnShippingDeductionCents: number | null
  returnShippingOptions?: { carrier: string; label: string; price_cents: number }[]
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Rücksendung-Annahme-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const name = payload.customerName?.trim() || 'Kunde'
  const code = payload.returnShippingCode.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const options = payload.returnShippingOptions ?? []
  const isFixedCarrier = options.length === 1
  const hasLegacyDeduction = payload.returnShippingDeductionCents != null && payload.returnShippingDeductionCents > 0 && options.length === 0
  const esc = (s: string) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

  let carrierBlock = ''
  if (options.length > 0) {
    if (isFixedCarrier) {
      const o = options[0]
      const priceStr = o.price_cents > 0 ? (o.price_cents / 100).toFixed(2).replace('.', ',') + ' €' : 'kostenlos'
      carrierBlock = `<p style="margin:0 0 12px;font-size:15px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">Bitte sende das Paket mit <strong>${esc(o.label || o.carrier)}</strong> zurück.${o.price_cents > 0 ? ` Die Rücksendekosten (${priceStr}) werden von deiner Erstattung abgezogen.` : ''}</p>`
    } else {
      const rows = options.map((o) => {
        const priceStr = o.price_cents > 0 ? (o.price_cents / 100).toFixed(2).replace('.', ',') + ' € (von Erstattung abgezogen)' : 'kostenlos'
        return `<tr><td style="padding:6px 12px 6px 0;font-size:14px;color:${SHOP_EMAIL_STYLES.text};">${esc(o.label || o.carrier)}</td><td style="padding:6px 0;font-size:14px;color:${SHOP_EMAIL_STYLES.muted};">${priceStr}</td></tr>`
      }).join('')
      carrierBlock = `<p style="margin:0 0 8px;font-size:14px;color:${SHOP_EMAIL_STYLES.muted};">Du kannst wählen:</p><table style="margin:0;font-size:14px;">${rows}</table>`
    }
  }
  const deduction =
    hasLegacyDeduction
      ? `<p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">Die Rücksendekosten in Höhe von ${(payload.returnShippingDeductionCents! / 100).toFixed(2).replace('.', ',')} € werden von deiner Erstattung abgezogen.</p>`
      : ''

  const bodyContent = `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${SHOP_EMAIL_STYLES.text};">
          Hallo ${name} – deine Rücksendung wurde angenommen
        </h1>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.muted};">
          Für Bestellung #${payload.orderNumber} haben wir deine Rücksendung freigegeben. So schickst du uns das Paket zurück:
        </p>
        ${carrierBlock}
        <div style="background:${SHOP_EMAIL_STYLES.bg};border:1px solid ${SHOP_EMAIL_STYLES.gold};border-radius:12px;padding:20px;margin:24px 0;">
          <p style="margin:0 0 8px;font-size:14px;color:${SHOP_EMAIL_STYLES.muted};">Dein Versandcode (z. B. bei DHL Retoure einlösen):</p>
          <p style="margin:0;font-size:18px;font-weight:700;color:${SHOP_EMAIL_STYLES.goldLight};font-family:monospace;letter-spacing:0.05em;word-break:break-all;">${code}</p>
        </div>
        ${deduction}
        <p style="margin:24px 0 0;font-size:15px;color:${SHOP_EMAIL_STYLES.muted};">
          Sobald das Paket bei uns angekommen ist, bearbeiten wir deine Erstattung.
        </p>
  `.trim()
  const html = renderShopEmailLayout({ pageTitle: 'Rücksendung angenommen', bodyContent, logoUrl })

  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Rücksendung angenommen – Versandcode #${payload.orderNumber}`,
      html,
    })
    if (error) {
      console.error('[Email] Rücksendung-Annahme Fehler:', error)
      return { ok: false, error: error.message }
    }
    console.log('[Email] Rücksendung-Annahme gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] Rücksendung-Annahme fehlgeschlagen:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * E-Mail: Stornierung angenommen – freundliche Bestätigung an den Kunden.
 */
export async function sendCancellationApprovedEmail(payload: {
  customerEmail: string
  customerName: string
  orderNumber: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Storno-Annahme-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const name = payload.customerName?.trim() || 'Kunde'
  const bodyContent = `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${SHOP_EMAIL_STYLES.text};">
          Hallo ${name},
        </h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          wir haben deine Stornierungsanfrage für Bestellung <strong>#${payload.orderNumber}</strong> bearbeitet.
        </p>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          Deine Bestellung wurde <strong>storniert</strong>. Falls bereits bezahlt, wird die Erstattung in Kürze veranlasst und du erhältst das Geld zurück.
        </p>
        <p style="margin:24px 0 0;font-size:15px;color:${SHOP_EMAIL_STYLES.muted};">
          Bei Fragen melde dich gern bei uns – wir helfen dir weiter.
        </p>
  `.trim()
  const html = renderShopEmailLayout({ pageTitle: 'Stornierung bestätigt', bodyContent, logoUrl })
  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Stornierung bestätigt – Bestellung #${payload.orderNumber}`,
      html,
    })
    if (error) return { ok: false, error: error.message }
    console.log('[Email] Storno-Annahme gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] Storno-Annahme fehlgeschlagen:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * E-Mail: Stornierung abgelehnt – freundlich, mit Entschuldigung und optionalem Grund.
 */
export async function sendCancellationRejectedEmail(payload: {
  customerEmail: string
  customerName: string
  orderNumber: string
  reasonFromAdmin?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Storno-Ablehnung-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const name = payload.customerName?.trim() || 'Kunde'
  const reasonBlock = payload.reasonFromAdmin?.trim()
    ? `<div style="background:${SHOP_EMAIL_STYLES.bg};border:1px solid ${SHOP_EMAIL_STYLES.border};border-radius:12px;padding:20px;margin:20px 0;font-size:15px;line-height:1.7;color:${SHOP_EMAIL_STYLES.text}; white-space:pre-wrap;">${payload.reasonFromAdmin.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
    : ''
  const bodyContent = `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${SHOP_EMAIL_STYLES.text};">
          Hallo ${name},
        </h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          zu deiner Stornierungsanfrage für Bestellung <strong>#${payload.orderNumber}</strong>: Wir haben uns sorgfältig damit befasst und müssen dir leider mitteilen, dass wir die Stornierung in diesem Fall nicht umsetzen können.
        </p>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.muted};">
          Es tut uns wirklich leid, dass wir deinem Wunsch diesmal nicht entsprechen können. Wir möchten uns dafür entschuldigen und dir die Entscheidung so gut wie möglich erklären.
        </p>
        ${reasonBlock}
        <p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          Wenn du Fragen hast oder etwas unklar ist, antworte einfach auf diese E-Mail – wir melden uns schnellstmöglich bei dir.
        </p>
  `.trim()
  const html = renderShopEmailLayout({ pageTitle: 'Zu deiner Stornierungsanfrage', bodyContent, logoUrl })
  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Zu deiner Stornierungsanfrage – Bestellung #${payload.orderNumber}`,
      html,
    })
    if (error) return { ok: false, error: error.message }
    console.log('[Email] Storno-Ablehnung gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] Storno-Ablehnung fehlgeschlagen:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * E-Mail: Rücksendung abgelehnt – freundlich, mit Entschuldigung und optionalem Grund.
 */
export async function sendReturnRejectedEmail(payload: {
  customerEmail: string
  customerName: string
  orderNumber: string
  reasonFromAdmin?: string | null
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Rücksendung-Ablehnung-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const name = payload.customerName?.trim() || 'Kunde'
  const reasonBlock = payload.reasonFromAdmin?.trim()
    ? `<div style="background:${SHOP_EMAIL_STYLES.bg};border:1px solid ${SHOP_EMAIL_STYLES.border};border-radius:12px;padding:20px;margin:20px 0;font-size:15px;line-height:1.7;color:${SHOP_EMAIL_STYLES.text}; white-space:pre-wrap;">${payload.reasonFromAdmin.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>`
    : ''
  const bodyContent = `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${SHOP_EMAIL_STYLES.text};">
          Hallo ${name},
        </h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          zu deiner Rücksendeanfrage für Bestellung <strong>#${payload.orderNumber}</strong>: Wir haben uns damit befasst und müssen dir leider mitteilen, dass wir die Rücksendung in diesem Fall nicht annehmen können.
        </p>
        <p style="margin:0 0 20px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.muted};">
          Es tut uns leid, dass wir deinem Wunsch diesmal nicht entsprechen können. Wir entschuldigen uns dafür und möchten dir die Entscheidung gerne verständlich machen.
        </p>
        ${reasonBlock}
        <p style="margin:24px 0 0;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          Bei Fragen oder wenn etwas unklar ist, antworte einfach auf diese E-Mail – wir sind für dich da.
        </p>
  `.trim()
  const html = renderShopEmailLayout({ pageTitle: 'Zu deiner Rücksendeanfrage', bodyContent, logoUrl })
  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Zu deiner Rücksendeanfrage – Bestellung #${payload.orderNumber}`,
      html,
    })
    if (error) return { ok: false, error: error.message }
    console.log('[Email] Rücksendung-Ablehnung gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] Rücksendung-Ablehnung fehlgeschlagen:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Dropshipping: Bestell-E-Mail an Lieferanten (type=email).
 * Enthält Lieferadresse und Produktliste für diese Bestellung.
 */
export async function sendSupplierOrderEmail(payload: {
  to: string
  orderNumber: string
  customerName: string
  shippingAddress: { street?: string; house_number?: string; postal_code?: string; city?: string; country?: string }
  items: Array<{ product_name: string; quantity: number; price?: number; sku?: string }>
  subject?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Lieferanten-Bestellmail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const esc = (s: string) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const addr = payload.shippingAddress
  const addressBlock = [
    addr.street,
    addr.house_number,
    [addr.postal_code, addr.city].filter(Boolean).join(' '),
    addr.country,
  ].filter(Boolean).map((line) => esc(String(line ?? ''))).join('<br/>') || '—'
  const rows = payload.items
    .map(
      (i) =>
        `<tr><td style="padding:8px 12px 8px 0;font-size:14px;color:${SHOP_EMAIL_STYLES.text};">${i.sku ? esc(`SKU: ${i.sku} – `) : ''}${esc(i.product_name)}</td><td style="padding:8px 0;font-size:14px;color:${SHOP_EMAIL_STYLES.text};">${i.quantity}</td></tr>`
    )
    .join('')
  const bodyContent = `
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:${SHOP_EMAIL_STYLES.text};">
          Neue Bestellung #${esc(payload.orderNumber)}
        </h1>
        <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:${SHOP_EMAIL_STYLES.muted};">
          Bitte liefern Sie die folgenden Artikel an den Kunden:
        </p>
        <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:${SHOP_EMAIL_STYLES.muted};">Lieferadresse (${esc(payload.customerName)}):</p>
        <div style="background:${SHOP_EMAIL_STYLES.bg};border:1px solid ${SHOP_EMAIL_STYLES.border};border-radius:12px;padding:16px;margin:12px 0 20px;font-size:15px;line-height:1.6;color:${SHOP_EMAIL_STYLES.text};">
          ${addressBlock}
        </div>
        <p style="margin:0 0 6px;font-size:14px;font-weight:600;color:${SHOP_EMAIL_STYLES.muted};">Artikel:</p>
        <table style="margin:0 0 20px;border-collapse:collapse;font-size:14px;">
          <thead><tr><th style="text-align:left;padding:6px 12px 6px 0;color:${SHOP_EMAIL_STYLES.muted};">Produkt</th><th style="text-align:left;padding:6px 0;color:${SHOP_EMAIL_STYLES.muted};">Menge</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
        <p style="margin:0;font-size:15px;color:${SHOP_EMAIL_STYLES.muted};">
          Vielen Dank für Ihre Zusammenarbeit.
        </p>
  `.trim()
  const html = renderShopEmailLayout({ pageTitle: `Bestellung #${payload.orderNumber}`, bodyContent, logoUrl })
  const subject = payload.subject ?? `Bestellung #${payload.orderNumber} – Premium Headshop – Lieferung an Kunde`
  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.to,
      subject,
      html,
    })
    if (error) return { ok: false, error: error.message }
    console.log('[Email] Lieferanten-Bestellmail gesendet an', payload.to, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] Lieferanten-Bestellmail fehlgeschlagen:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Sendet die Bewertungsanfrage-E-Mail (10 Tage nach Versand).
 * reviewUrl = Link zum Kundenkonto / Bestellungen.
 */
export async function sendReviewRequestEmail(payload: {
  orderNumber: string
  customerName: string
  customerEmail: string
  reviewUrl: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Bewertungsanfrage wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const html = await renderReviewRequestEmail({
    orderNumber: payload.orderNumber,
    customerName: payload.customerName,
    reviewUrl: payload.reviewUrl,
    logoUrl,
  })
  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Wie hat dir deine Bestellung #${payload.orderNumber} gefallen?`,
      html,
    })
    if (error) {
      console.error('[Email] ReviewRequest error:', error)
      return { ok: false, error: error.message }
    }
    console.log('[Email] Bewertungsanfrage gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] ReviewRequest failed:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Sendet Subscribe-&-Save-Zahlungslink an den Kunden.
 */
export async function sendSubscriptionPaymentLinkEmail(payload: {
  customerName: string
  customerEmail: string
  productName: string
  quantity: number
  orderNumber: string
  checkoutUrl: string
  total: number
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Abo-Zahlungslink wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const html = await renderSubscriptionPaymentLinkEmail({
    customerName: payload.customerName,
    productName: payload.productName,
    quantity: payload.quantity,
    orderNumber: payload.orderNumber,
    checkoutUrl: payload.checkoutUrl,
    total: payload.total,
    logoUrl,
  })
  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Subscribe & Save: Zahlung ausstehend #${payload.orderNumber}`,
      html,
    })
    if (error) return { ok: false, error: error.message }
    console.log('[Email] Abo-Zahlungslink gesendet an', payload.customerEmail, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] SubscriptionPaymentLink failed:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Sendet an den Werber: „Dein Freund hat bestellt – du erhältst 200 Treuepunkte.“
 */
export async function sendReferralSuccessEmail(payload: {
  to: string
  referrerName?: string
  rewardText?: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Referral-Erfolgs-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const html = await renderReferralSuccessEmail({
    referrerName: payload.referrerName,
    rewardText: payload.rewardText ?? '200 Treuepunkte',
    logoUrl,
  })
  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.to,
      subject: 'Dein Freund hat bestellt – 200 Punkte für dich!',
      html,
    })
    if (error) {
      console.error('[Email] ReferralSuccess failed:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] ReferralSuccess failed:', err)
    return { ok: false, error: err.message }
  }
}

/**
 * Sendet den Willkommens-Rabattcode 1 Tag nach Newsletter-Anmeldung.
 * Animiert zum Kauf und erinnert an den Shop.
 */
export async function sendNewsletterDiscountCodeEmail(
  to: string,
  discountCode: string
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Newsletter-Rabatt-E-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const html = await renderNewsletterDiscountCodeEmail({ discountCode, logoUrl })
  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to,
      subject: `Dein Willkommens-Rabatt – ${process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'}`,
      html,
    })
    if (error) {
      console.error('[Email] NewsletterDiscountCode error:', error)
      return { ok: false, error: error.message }
    }
    console.log('[Email] Newsletter-Rabattcode gesendet an', to, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] NewsletterDiscountCode failed:', err)
    return { ok: false, error: err.message }
  }
}

export interface DropRadarRestockPayload {
  to: string
  productName: string
  productSlug: string
  productImageUrl?: string | null
  productPrice?: number | null
}

/**
 * Blueprint Drop-Radar: Benachrichtigung bei Restock – Produkt wieder auf Lager.
 */
export async function sendDropRadarRestockEmail(
  payload: DropRadarRestockPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Email] RESEND_API_KEY nicht gesetzt – Drop-Radar Restock-E-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }
  const logoUrl = await getEmailLogoUrl()
  const productUrl = `${BASE_URL}/shop/${payload.productSlug}`
  const html = await renderDropRadarRestockEmail({
    productName: payload.productName,
    productUrl,
    productImageUrl: payload.productImageUrl,
    productPrice: payload.productPrice,
    logoUrl,
  })
  try {
    const { data, error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.to,
      subject: `Wieder da: ${payload.productName} – Premium Headshop`,
      html,
    })
    if (error) {
      console.error('[Email] DropRadarRestock error:', error)
      return { ok: false, error: error.message }
    }
    console.log('[Email] Drop-Radar Restock gesendet an', payload.to, data?.id)
    return { ok: true }
  } catch (e: unknown) {
    const err = e instanceof Error ? e : new Error(String(e))
    console.error('[Email] DropRadarRestock failed:', err)
    return { ok: false, error: err.message }
  }
}

export interface B2BOrderPendingApprovalPayload {
  customerEmail: string
  customerName: string
  orderNumber: string
  total: number
}

export async function sendB2BOrderPendingApprovalEmail(
  payload: B2BOrderPendingApprovalPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }
  const logoUrl = await getEmailLogoUrl()
  const html = `
    <div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:24px;background:#1a1a1a;color:#e5e5e5;border-radius:12px;">
      ${logoUrl ? `<img src="${logoUrl}" alt="" style="max-height:48px;margin-bottom:24px;" />` : ''}
      <h2 style="color:#D4AF37;margin:0 0 16px;">Bestellung wartet auf Freigabe</h2>
      <p>Hallo ${payload.customerName},</p>
      <p>Ihre Bestellung <strong>#${payload.orderNumber}</strong> (${Number(payload.total).toFixed(2)} €) wurde erstellt.</p>
      <p>Sie wartet auf Freigabe durch Ihren Einkaufsverantwortlichen gemäß Ihrer B2B-Einkaufsrichtlinien. Sie erhalten eine E-Mail, sobald die Freigabe erteilt wurde und die Zahlung freigeschaltet ist.</p>
      <p style="color:#8a8a8a;font-size:13px;margin-top:24px;">Mit freundlichen Grüßen<br/>Ihr Premium Headshop</p>
    </div>`
  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: `Bestellung #${payload.orderNumber} wartet auf Freigabe`,
      html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

export interface ProductRecallNotificationPayload {
  customerEmail: string
  customerName: string
  recallReason: string
  productName?: string
  actionRequired?: string
  publicAnnouncementUrl?: string
  regulatoryAuthority?: string
}

export async function sendProductRecallNotificationEmail(
  payload: ProductRecallNotificationPayload
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) return { ok: false, error: 'RESEND_API_KEY not configured' }
  const logoUrl = await getEmailLogoUrl()
  const { renderProductRecallNotificationEmail } = await import('@/components/emails/ProductRecallNotification')
  const html = await renderProductRecallNotificationEmail({
    customerName: payload.customerName,
    recallReason: payload.recallReason,
    productName: payload.productName,
    actionRequired: payload.actionRequired,
    publicAnnouncementUrl: payload.publicAnnouncementUrl,
    regulatoryAuthority: payload.regulatoryAuthority,
    logoUrl,
  })
  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.customerEmail,
      subject: 'Wichtige Produktrückruf-Information – Premium Headshop',
      html,
    })
    if (error) return { ok: false, error: error.message }
    return { ok: true }
  } catch (e) {
    return { ok: false, error: (e as Error).message }
  }
}

/** Resend-Fehlermeldungen in verständliche deutsche Hinweise übersetzen. */
function toResendFriendlyError(message: string): string {
  if (!message || typeof message !== 'string') return 'E-Mail konnte nicht gesendet werden.'
  const m = message.toLowerCase()
  if (m.includes('only send testing emails') || m.includes('verify a domain') || m.includes('to your own email')) {
    return 'Mit der Resend-Testadresse dürfen E-Mails nur an deine eigene E-Mail gesendet werden. Um an Kunden zu senden: Domain unter resend.com/domains verifizieren und RESEND_FROM_EMAIL auf eine Adresse mit dieser Domain setzen (z. B. support@deine-domain.de).'
  }
  if (m.includes('domain is not verified')) {
    return 'Absender-Domain ist bei Resend nicht verifiziert. Bitte Domain unter resend.com/domains hinzufügen und verifizieren.'
  }
  return message
}
