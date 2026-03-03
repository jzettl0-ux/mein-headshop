import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { isRecaptchaConfigured, verifyRecaptcha } from '@/lib/recaptcha'
import { checkRateLimit, PASSWORD_RESET_LIMITS } from '@/lib/rate-limit'
import { hasPasswordResetEmail, sendPasswordResetEmail } from '@/lib/send-password-reset-email'

export const dynamic = 'force-dynamic'

/** OWASP: Einheitliche Antwortzeit (mind. 1,5 s), um User-Enumeration zu erschweren */
const MIN_RESPONSE_TIME_MS = 1500

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim()
    if (first) return first
  }
  if (realIp) return realIp
  return 'unknown'
}

/**
 * POST – Passwort-Reset anfordern (Staff + Kunden).
 * Body: { email: string, captcha_token?: string, redirect_to: string }
 * redirect_to = relativer Pfad, z. B. /login/set-password oder /auth/set-password.
 *
 * Sicherheit (OWASP/NIST 2024):
 * - Rate-Limiting pro IP und pro E-Mail
 * - CAPTCHA (wenn konfiguriert)
 * - Einheitliche Antwortzeit und gleiche Meldung (kein Account-Enumeration)
 * - E-Mail-Versand nur über Resend (kein Supabase-Standard-Mail, damit Rate-Limit bei uns liegt)
 */
export async function POST(req: NextRequest) {
  const startedAt = Date.now()

  try {
    const body = await req.json().catch(() => ({}))
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
    const captchaToken = typeof body.captcha_token === 'string' ? body.captcha_token.trim() : ''
    const redirectToPath = typeof body.redirect_to === 'string' ? body.redirect_to.trim() : '/login/set-password'

    if (!email) {
      await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
      return NextResponse.json(
        { success: true, message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.' }
      )
    }

    const ip = getClientIp(req)

    // Rate-Limiting (OWASP)
    const ipLimit = checkRateLimit(`pwreset:ip:${ip}`, PASSWORD_RESET_LIMITS.perIp.max, PASSWORD_RESET_LIMITS.perIp.windowSeconds)
    if (!ipLimit.allowed) {
      await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
      return NextResponse.json(
        { error: 'Zu viele Anfragen. Bitte später erneut versuchen.' },
        { status: 429, headers: { 'Retry-After': String(Math.ceil((ipLimit.resetAt - Date.now()) / 1000)) } }
      )
    }

    const emailLimit = checkRateLimit(
      `pwreset:email:${email}`,
      PASSWORD_RESET_LIMITS.perEmail.max,
      PASSWORD_RESET_LIMITS.perEmail.windowSeconds
    )
    if (!emailLimit.allowed) {
      await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
      return NextResponse.json(
        { success: true, message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.' }
      )
    }

    if (isRecaptchaConfigured()) {
      const verify = await verifyRecaptcha(captchaToken)
      if (!verify.success) {
        await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
        return NextResponse.json(
          { error: verify.error || 'Sicherheitsprüfung fehlgeschlagen. Bitte versuche es erneut.' },
          { status: 400 }
        )
      }
    }

    if (!hasPasswordResetEmail()) {
      await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
      return NextResponse.json(
        { error: 'Passwort-Reset derzeit nicht verfügbar. Bitte später versuchen oder Support kontaktieren.' },
        { status: 503 }
      )
    }

    if (!hasSupabaseAdmin()) {
      await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
      return NextResponse.json(
        { success: true, message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.' }
      )
    }

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || (req.nextUrl.origin || 'http://localhost:3000')
    const redirectTo = redirectToPath.startsWith('http') ? redirectToPath : `${baseUrl.replace(/\/$/, '')}${redirectToPath.startsWith('/') ? '' : '/'}${redirectToPath}`

    let admin
    try {
      admin = createSupabaseAdmin()
    } catch {
      await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
      return NextResponse.json(
        { success: true, message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.' }
      )
    }

    const { data, error } = await admin.auth.admin.generateLink({
      type: 'recovery',
      email,
      options: { redirectTo },
    })

    if (error || !data?.properties?.action_link) {
      await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
      return NextResponse.json(
        { success: true, message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.' }
      )
    }

    const sendResult = await sendPasswordResetEmail(email, data.properties.action_link)
    if (!sendResult.ok) {
      console.error('[ForgotPassword] Send email failed:', sendResult.error)
      await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
      return NextResponse.json(
        { error: 'E-Mail konnte nicht gesendet werden. Bitte später erneut versuchen.' },
        { status: 503 }
      )
    }

    await delay(MIN_RESPONSE_TIME_MS - (Date.now() - startedAt))
    return NextResponse.json({
      success: true,
      message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.',
    })
  } catch (e) {
    console.error('[ForgotPassword] Error:', e)
    await delay(Math.max(0, MIN_RESPONSE_TIME_MS - (Date.now() - startedAt)))
    return NextResponse.json(
      { success: true, message: 'Falls ein Konto mit dieser E-Mail existiert, wurde eine E-Mail gesendet.' }
    )
  }
}

function delay(ms: number): Promise<void> {
  if (ms <= 0) return Promise.resolve()
  return new Promise((r) => setTimeout(r, ms))
}
