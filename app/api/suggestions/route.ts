import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { isRecaptchaConfigured, verifyRecaptcha } from '@/lib/recaptcha'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function getClientId(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
  return `suggestions:${ip}`
}

const SUGGESTION_TYPES = ['category', 'feature', 'improvement', 'design', 'other'] as const

export async function POST(req: NextRequest) {
  try {
    const { allowed } = checkRateLimit(getClientId(req), 5, 900)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Zu viele Vorschläge. Bitte in 15 Minuten erneut versuchen.' },
        { status: 429 }
      )
    }

    if (!hasSupabaseAdmin()) {
      return NextResponse.json({ error: 'Vorschläge derzeit nicht verfügbar.' }, { status: 503 })
    }

    const body = await req.json().catch(() => ({}))
    const type = typeof body.suggestion_type === 'string' && (SUGGESTION_TYPES as readonly string[]).includes(body.suggestion_type)
      ? body.suggestion_type
      : 'other'
    const title = typeof body.title === 'string' ? body.title.trim().slice(0, 200) : ''
    const description = typeof body.description === 'string' ? body.description.trim().slice(0, 3000) : ''
    const name = typeof body.name === 'string' ? body.name.trim().slice(0, 100) : ''
    const email = typeof body.email === 'string' ? body.email.trim().slice(0, 255) : ''
    const captchaToken = typeof body.captcha_token === 'string' ? body.captcha_token.trim() : ''

    if (!title || !name) {
      return NextResponse.json(
        { error: 'Bitte Titel, deinen Namen und eine Beschreibung angeben.' },
        { status: 400 }
      )
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { error: 'Bitte eine gültige E-Mail-Adresse angeben.' },
        { status: 400 }
      )
    }

    if (isRecaptchaConfigured()) {
      const verify = await verifyRecaptcha(captchaToken)
      if (!verify.success) {
        return NextResponse.json(
          { error: verify.error || 'Bitte bestätige, dass du kein Roboter bist (reCAPTCHA).' },
          { status: 400 }
        )
      }
    }

    const admin = createSupabaseAdmin()
    const { error } = await admin.from('shop_suggestions').insert({
      suggestion_type: type,
      title,
      description: description || null,
      submitted_by_name: name,
      submitted_by_email: email,
      status: 'new',
    })

    if (error) {
      const codeStr = String((error as { code?: string }).code ?? '')
      if (codeStr === '42P01' || String(error.message).includes('does not exist')) {
        return NextResponse.json(
          { error: 'Tabelle für Vorschläge fehlt. Bitte migration-shop-suggestions.sql im Supabase SQL Editor ausführen.' },
          { status: 503 }
        )
      }
      return NextResponse.json(
        { error: 'Vorschlag konnte nicht gespeichert werden.', detail: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (e) {
    console.error('[Suggestions] POST error:', e)
    return NextResponse.json({ error: 'Ein Fehler ist aufgetreten.' }, { status: 500 })
  }
}
