import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

export function hasGdprDeleteEmail(): boolean {
  return !!resend
}

/**
 * Sendet Bestätigungs-Mail für Konto-Löschung (Art. 17 DSGVO).
 * Link führt zu /api/user/gdpr-delete-confirm?token=...
 */
export async function sendGdprDeleteConfirmEmail(to: string, confirmLink: string): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: 'E-Mail-Versand nicht konfiguriert (RESEND_API_KEY)' }
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:#fafafa;color:#1a1a1a;padding:24px;">
  <div style="max-width:420px;margin:0 auto;">
    <p style="font-size:16px;line-height:1.5;">Hallo,</p>
    <p style="font-size:16px;line-height:1.5;">Sie haben die Löschung Ihres Kontos angefordert (Recht auf Vergessenwerden, Art. 17 DSGVO).</p>
    <p style="font-size:16px;line-height:1.5;">Bitte bestätigen Sie die Löschung, indem Sie auf den folgenden Link klicken:</p>
    <p style="margin:28px 0;">
      <a href="${confirmLink}" style="display:inline-block;background:#2D5A2D;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Konto-Löschung bestätigen</a>
    </p>
    <p style="font-size:14px;color:#6b6b6b;">Der Link ist 24 Stunden gültig. Wenn Sie die Anfrage nicht gestellt haben, ignorieren Sie diese E-Mail – Ihr Konto bleibt unverändert.</p>
    <p style="font-size:14px;color:#8a8a8a;margin-top:32px;">— ${SITE_NAME}</p>
  </div>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to,
      subject: `Konto-Löschung bestätigen – ${SITE_NAME}`,
      html,
    })
    if (error) {
      console.error('[GDPR Delete] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[GDPR Delete] Send error:', msg)
    return { ok: false, error: msg }
  }
}

export function getGdprDeleteConfirmLink(token: string): string {
  return `${BASE_URL}/api/user/gdpr-delete-confirm?token=${encodeURIComponent(token)}`
}
