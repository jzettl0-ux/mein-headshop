import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseAdmin, hasSupabaseAdmin } from '@/lib/supabase-admin'
import { checkRateLimit } from '@/lib/rate-limit'

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
}

/**
 * POST – Newsletter-Anmeldung (öffentlich).
 * Speichert E-Mail in newsletter_subscribers. Der Willkommens-Rabattcode
 * wird 1 Tag nach Anmeldung per E-Mail versendet (Cron send-newsletter-discount-codes).
 */
export async function POST(req: NextRequest) {
  const clientIp = getClientIp(req)
  const { allowed } = checkRateLimit(`newsletter-signup:${clientIp}`, 5, 900)
  if (!allowed) {
    return NextResponse.json(
      { error: 'Zu viele Anmeldungen. Bitte in 15 Minuten erneut versuchen.' },
      { status: 429 }
    )
  }

  if (!hasSupabaseAdmin()) {
    return NextResponse.json({ error: 'Newsletter-Anmeldung derzeit nicht möglich.' }, { status: 503 })
  }

  const body = await req.json().catch(() => ({}))
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const source = typeof body.source === 'string' ? body.source.trim().slice(0, 50) : 'footer'

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Bitte eine gültige E-Mail-Adresse angeben.' }, { status: 400 })
  }

  const admin = createSupabaseAdmin()

  const { data: existing } = await admin
    .from('newsletter_subscribers')
    .select('id, is_active')
    .eq('email', email)
    .maybeSingle()

  if (existing) {
    if (existing.is_active) {
      return NextResponse.json({
        success: true,
        message: 'Du bist bereits für den Newsletter angemeldet.',
      })
    }
    await admin
      .from('newsletter_subscribers')
      .update({ is_active: true, unsubscribed_at: null, source, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
  } else {
    const { error } = await admin.from('newsletter_subscribers').insert({
      email,
      is_active: true,
      source,
    })
    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({
          success: true,
          message: 'Du bist bereits angemeldet.',
        })
      }
      return NextResponse.json({ error: 'Anmeldung fehlgeschlagen.' }, { status: 500 })
    }
  }

  return NextResponse.json({
    success: true,
    message: 'Vielen Dank! Du erhältst ab sofort unseren Newsletter.',
  })
}
