/**
 * Vendor-E-Mails: Willkommen bei Genehmigung, Ablehnung bei Reject
 */

import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'

async function getLogoUrl(): Promise<string | undefined> {
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

export function hasVendorEmail(): boolean {
  return !!resend
}

/**
 * Willkommens-E-Mail an Vendor nach Genehmigung der Anfrage
 * registrationLink: Link zum Passwort setzen / Registrierung abschließen (aus Supabase generateLink)
 */
export async function sendVendorWelcomeEmail(
  to: string,
  options: { companyName: string; contactPerson?: string; registrationLink?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY nicht konfiguriert' }
  }

  const { companyName, contactPerson, registrationLink } = options
  const logoUrl = await getLogoUrl()
  const salutation = contactPerson ? `Hallo ${contactPerson}` : `Hallo`

  const registrationBlock = registrationLink
    ? `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#525252;">
        Klicke auf den Button unten, um dein Passwort zu setzen und dich für den Shop zu registrieren. Mit deinem Konto kannst du später deine Angebote und Abrechnungen einsehen.
      </p>
      <p style="margin:0 0 20px;text-align:center;">
        <a href="${registrationLink}" style="display:inline-block;padding:12px 24px;background:#2D5A2D;color:#fff;text-decoration:none;border-radius:8px;font-weight:600;">Jetzt registrieren</a>
      </p>
      `
    : `
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#525252;">
        Wir melden uns in Kürze mit den nächsten Schritten – Produktanmeldung, Konditionen und technische Einbindung.
      </p>
      `

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#FDFBF5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    ${logoUrl ? `<div style="padding:24px 24px 0;"><img src="${logoUrl}" alt="${SITE_NAME}" style="max-height:48px;" /></div>` : ''}
    <div style="padding:24px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#262626;">Willkommen als Partner!</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#525252;">
        ${salutation},
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#525252;">
        Wir haben deine Partner-Anfrage geprüft und freuen uns, <strong>${companyName}</strong> als Verkäufer bei ${SITE_NAME} willkommen zu heißen.
      </p>
      ${registrationBlock}
      <p style="margin:0;font-size:15px;line-height:1.6;color:#525252;">
        Bei Fragen stehen wir dir jederzeit per E-Mail zur Verfügung.
      </p>
      <p style="margin:24px 0 0;font-size:14px;color:#737373;">
        Herzliche Grüße<br />Dein ${SITE_NAME} Team
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to,
      subject: `Willkommen als Partner – ${SITE_NAME}`,
      html,
    })
    if (error) {
      console.error('[VendorWelcome] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[VendorWelcome]', msg)
    return { ok: false, error: msg }
  }
}

/**
 * Ablehnungs-E-Mail an Vendor mit optionalem Grund
 */
export async function sendVendorRejectionEmail(
  to: string,
  options: { companyName: string; contactPerson?: string; rejectionReason?: string }
): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: 'RESEND_API_KEY nicht konfiguriert' }
  }

  const { companyName, contactPerson, rejectionReason } = options
  const logoUrl = await getLogoUrl()
  const salutation = contactPerson ? `Hallo ${contactPerson}` : `Hallo`

  const reasonBlock = rejectionReason
    ? `<p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#525252;">Grund: ${rejectionReason}</p>`
    : ''

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;font-family:system-ui,sans-serif;background:#FDFBF5;padding:24px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,.08);">
    ${logoUrl ? `<div style="padding:24px 24px 0;"><img src="${logoUrl}" alt="${SITE_NAME}" style="max-height:48px;" /></div>` : ''}
    <div style="padding:24px;">
      <h1 style="margin:0 0 16px;font-size:20px;color:#262626;">Zu deiner Partner-Anfrage</h1>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#525252;">
        ${salutation},
      </p>
      <p style="margin:0 0 16px;font-size:15px;line-height:1.6;color:#525252;">
        Vielen Dank für dein Interesse an einer Partnerschaft mit ${SITE_NAME}. Leider können wir die Anfrage von <strong>${companyName}</strong> derzeit nicht positiv beschieden.
      </p>
      ${reasonBlock}
      <p style="margin:0;font-size:15px;line-height:1.6;color:#525252;">
        Bei Rückfragen kannst du uns gerne per E-Mail kontaktieren.
      </p>
      <p style="margin:24px 0 0;font-size:14px;color:#737373;">
        Mit freundlichen Grüßen<br />Dein ${SITE_NAME} Team
      </p>
    </div>
  </div>
</body>
</html>`

  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to,
      subject: `Zu deiner Partner-Anfrage – ${SITE_NAME}`,
      html,
    })
    if (error) {
      console.error('[VendorRejection] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[VendorRejection]', msg)
    return { ok: false, error: msg }
  }
}
