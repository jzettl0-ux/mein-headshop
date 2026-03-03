import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null
const SITE_NAME = process.env.NEXT_PUBLIC_SITE_NAME || 'Premium Headshop'

export function hasPasswordResetEmail(): boolean {
  return !!resend
}

/**
 * Sendet E-Mail mit Link zum Zurücksetzen des Passworts (OWASP: keine Passwörter in E-Mails).
 */
export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    return { ok: false, error: 'E-Mail-Versand nicht konfiguriert (RESEND_API_KEY)' }
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
<body style="margin:0;font-family:system-ui,-apple-system,sans-serif;background:#FDFBF5;color:#262626;padding:24px;">
  <div style="max-width:420px;margin:0 auto;">
    <p style="font-size:16px;line-height:1.5;">Hallo,</p>
    <p style="font-size:16px;line-height:1.5;">du hast angefordert, dein Passwort zurückzusetzen. Klicke auf den Button unten, um ein neues Passwort zu setzen.</p>
    <p style="margin:28px 0;">
      <a href="${resetLink}" style="display:inline-block;background:linear-gradient(135deg,#2D5A2D,#3D8B3D);color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-weight:600;">Passwort zurücksetzen</a>
    </p>
    <p style="font-size:14px;color:#525252;">Der Link ist nur begrenzt gültig. Wenn du die Anfrage nicht gestellt hast, ignoriere diese E-Mail.</p>
    <p style="font-size:14px;color:#525252;margin-top:32px;">— ${SITE_NAME}</p>
  </div>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to,
      subject: `Passwort zurücksetzen – ${SITE_NAME}`,
      html,
    })
    if (error) {
      console.error('[PasswordReset] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[PasswordReset] Send error:', msg)
    return { ok: false, error: msg }
  }
}
