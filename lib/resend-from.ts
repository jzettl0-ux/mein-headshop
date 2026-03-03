/**
 * Resend erlaubt kein Senden von @gmail.com, @web.de etc. – nur verifizierte Domains oder onboarding@resend.dev.
 * Wenn RESEND_FROM_EMAIL eine nicht verifizierbare Domain hat, wird der Resend-Standard genutzt.
 */

const RESEND_DEFAULT = 'Headshop <onboarding@resend.dev>'

/** Domains, die bei Resend nicht als Absender genutzt werden können (ohne eigene Domain-Verifizierung). */
const UNVERIFIABLE_DOMAINS = [
  'gmail.com', 'googlemail.com', 'yahoo.com', 'yahoo.de', 'outlook.com', 'hotmail.com', 'hotmail.de',
  'web.de', 'gmx.de', 'gmx.net', 't-online.de', 'freenet.de', 'icloud.com', 'live.com', 'me.com',
]

function getDomainFromEmail(email: string): string {
  const part = email.split('@')[1] || ''
  return part.toLowerCase().trim()
}

/**
 * Liefert die Absender-Adresse für Resend.
 * Nutzt RESEND_FROM_EMAIL nur, wenn die Domain keine typische Freemail-Domain ist
 * (dann musst du deine eigene Domain unter https://resend.com/domains verifizieren).
 */
export function getResendFrom(): string {
  const raw = process.env.RESEND_FROM_EMAIL || ''
  if (!raw.trim()) return RESEND_DEFAULT

  const match = raw.match(/<([^>]+)>/) || raw.match(/(\S+@\S+)/)
  const email = match ? match[1].trim().toLowerCase() : raw.trim().toLowerCase()
  const domain = getDomainFromEmail(email)

  if (UNVERIFIABLE_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) {
    console.warn(
      '[Resend] RESEND_FROM_EMAIL verwendet eine nicht verifizierbare Domain (' +
        domain +
        '). Absender wird auf ' +
        RESEND_DEFAULT +
        ' gesetzt. Für eigene Absender-Adresse Domain unter https://resend.com/domains verifizieren.'
    )
    return RESEND_DEFAULT
  }

  return raw.trim()
}

/** true, wenn aktuell die Resend-Testadresse (Sandbox) genutzt wird – dann nur Versand an eigene E-Mail erlaubt. */
export function isResendSandbox(): boolean {
  return getResendFrom().toLowerCase().includes('onboarding@resend.dev')
}
