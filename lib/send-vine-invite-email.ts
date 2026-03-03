import { Resend } from 'resend'
import { getResendFrom } from '@/lib/resend-from'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

/**
 * Sendet Vine-Einladungs-E-Mail an Tester.
 * Enthält Link zur Annahme/Ablehnung.
 */
export async function sendVineInviteEmail(payload: {
  testerEmail: string
  productName: string
  acceptUrl: string
}): Promise<{ ok: boolean; error?: string }> {
  if (!resend) {
    console.log('[Vine] RESEND_API_KEY nicht gesetzt – Einladungs-E-Mail wird nicht versendet.')
    return { ok: false, error: 'RESEND_API_KEY not configured' }
  }

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Produkttester-Einladung</title></head>
<body style="font-family: system-ui, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <h2 style="color: #1a1a1a;">Du wurdest als Produkttester eingeladen</h2>
  <p>Hallo,</p>
  <p>du wurdest eingeladen, <strong>${escapeHtml(payload.productName)}</strong> als Tester zu bewerten.</p>
  <p>Du erhältst ein kostenloses Muster und schreibst danach eine Bewertung zum Produkt.</p>
  <p style="margin-top: 24px;">
    <a href="${escapeHtml(payload.acceptUrl)}" style="display: inline-block; padding: 12px 24px; background: #D4AF37; color: #000; text-decoration: none; font-weight: bold; border-radius: 6px;">
      Einladung ansehen & annehmen
    </a>
  </p>
  <p style="margin-top: 24px; font-size: 14px; color: #666;">
    Oder kopiere diesen Link in deinen Browser:<br>
    <a href="${escapeHtml(payload.acceptUrl)}" style="color: #D4AF37; word-break: break-all;">${escapeHtml(payload.acceptUrl)}</a>
  </p>
  <p style="margin-top: 32px; font-size: 12px; color: #999;">
    Mit freundlichen Grüßen,<br>
    Dein Premium Headshop Team
  </p>
</body>
</html>
`.trim()

  try {
    const { error } = await resend.emails.send({
      from: getResendFrom(),
      to: payload.testerEmail,
      subject: `Produkttester-Einladung: ${payload.productName}`,
      html,
    })
    if (error) {
      console.error('[Vine Invite] Resend error:', error)
      return { ok: false, error: error.message }
    }
    return { ok: true }
  } catch (e) {
    console.error('[Vine Invite]', e)
    return { ok: false, error: String(e) }
  }
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}
