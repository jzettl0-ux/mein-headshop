/**
 * Newsletter-Template nach Clean-Luxe-Styleguide.
 * Layout: Logo zentriert oben, 40px Abstand, Serif-Headlines / Sans-Serif-Fließtext.
 * Für Outlook, Apple Mail und Gmail optimiert (Tabellen, Inline-Styles).
 */

const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://premium-headshop.de'

export type NewsletterEventMode = 'weihnachtlich' | null | undefined

export interface WrapNewsletterOptions {
  /** Logo-URL aus site_settings (logo_url). Zentriert ganz oben. */
  logoUrl?: string | null
  /** Saisonaler Modus: z. B. weihnachtlich = dezente Gold-Linie, festlicher Akzent. */
  eventMode?: NewsletterEventMode
}

export function wrapNewsletterHtml(
  bodyHtml: string,
  unsubscribeToken?: string,
  options?: WrapNewsletterOptions
): string {
  const logoUrl = options?.logoUrl?.trim() || null
  const eventMode = options?.eventMode || null
  const unsubscribeUrl = unsubscribeToken
    ? `${SITE_URL}/api/newsletter/unsubscribe?token=${encodeURIComponent(unsubscribeToken)}`
    : `${SITE_URL}/account`

  const goldAccent = '#D4AF37'
  const redAccent = '#8B0000'

  const logoBlock = logoUrl
    ? `
    <tr>
      <td align="center" style="padding: 40px 40px 24px;">
        <img src="${logoUrl}" alt="${SITE_NAME}" width="180" style="max-width: 180px; height: auto; display: block;" />
      </td>
    </tr>`
    : `
    <tr>
      <td align="center" style="padding: 40px 40px 24px; font-family: Georgia, 'Times New Roman', serif; font-size: 14px; letter-spacing: 0.2em; text-transform: uppercase; color: #6b6b6b;">${SITE_NAME}</td>
    </tr>`

  const eventModeLine =
    eventMode === 'weihnachtlich'
      ? `
    <tr>
      <td style="padding: 0 40px 16px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height: 1px; background-color: ${redAccent}; font-size: 0;">&nbsp;</td></tr></table></td>
    </tr>
    <tr><td style="padding: 0 40px 8px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td style="height: 1px; background-color: ${goldAccent}; font-size: 0;">&nbsp;</td></tr></table></td>
    </tr>`
      : ''

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${SITE_NAME}</title>
</head>
<body style="margin:0; padding:0; background:#f8f7f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f8f7f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.06);">
          ${logoBlock}
          ${eventModeLine}
          <tr>
            <td style="padding: 0 40px 40px 40px;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 16px; line-height: 1.6; color: #1a1a1a;">
                ${bodyHtml}
              </div>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 40px 40px; border-top: 1px solid #e8e6e3; background: #fafaf9;">
              <p style="margin: 0 0 8px; font-size: 13px; color: #8a8a8a;">
                Du erhältst diese E-Mail, weil du dich für unseren Newsletter angemeldet hast.
              </p>
              <p style="margin: 0;">
                <a href="${unsubscribeUrl}" style="color: #8a8a8a; text-decoration: underline; font-size: 13px;">Vom Newsletter abmelden</a>
              </p>
              <p style="margin: 16px 0 0; font-size: 12px; color: #a3a3a3;">
                &copy; ${new Date().getFullYear()} ${SITE_NAME}. Alle Rechte vorbehalten.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
