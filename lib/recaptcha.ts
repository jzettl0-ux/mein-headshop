/**
 * Serverseitige Verifizierung des reCAPTCHA v2 Tokens.
 * Nur auf dem Server verwenden (RECAPTCHA_SECRET_KEY darf nicht im Client landen).
 */

export interface RecaptchaVerifyResult {
  success: boolean
  /** Fehlermeldung von Google oder bei fehlendem Key */
  error?: string
  /** Score nur bei v3; bei v2 nicht vorhanden */
  score?: number
}

/**
 * Verifiziert den vom Client gesendeten reCAPTCHA-Token bei Google.
 * Gibt { success: true } zurück, wenn der Nutzer die Prüfung bestanden hat.
 */
export async function verifyRecaptcha(token: string | null | undefined): Promise<RecaptchaVerifyResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  if (!secret || !secret.trim()) {
    return { success: false, error: 'reCAPTCHA nicht konfiguriert (RECAPTCHA_SECRET_KEY fehlt).' }
  }

  if (!token || !token.trim()) {
    return { success: false, error: 'Kein reCAPTCHA-Token erhalten.' }
  }

  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        secret,
        response: token,
      }),
    })

    const data = (await res.json()) as {
      success?: boolean
      'error-codes'?: string[]
      score?: number
    }

    if (!res.ok) {
      return { success: false, error: 'Verifizierung fehlgeschlagen.' }
    }

    if (!data.success) {
      const codes = data['error-codes'] || []
      const msg = codes.includes('timeout-or-duplicate')
        ? 'Prüfung abgelaufen. Bitte erneut versuchen.'
        : codes.includes('invalid-input-response')
          ? 'Ungültige Prüfung. Bitte erneut versuchen.'
          : codes.length ? codes.join(', ') : 'reCAPTCHA-Prüfung fehlgeschlagen.'
      return { success: false, error: msg }
    }

    return { success: true, score: data.score }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    console.error('[recaptcha] Verify error:', msg)
    return { success: false, error: 'Verifizierung konnte nicht durchgeführt werden.' }
  }
}

/**
 * Prüft, ob reCAPTCHA überhaupt aktiviert ist (Site-Key gesetzt).
 * Wenn nicht, kann die API optional ohne CAPTCHA akzeptieren (z. B. für lokale Entwicklung).
 */
export function isRecaptchaConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY?.trim() && process.env.RECAPTCHA_SECRET_KEY?.trim())
}
