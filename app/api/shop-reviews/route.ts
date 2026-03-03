import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { isRecaptchaConfigured, verifyRecaptcha } from '@/lib/recaptcha'
import { checkRateLimit } from '@/lib/rate-limit'

export const dynamic = 'force-dynamic'

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || 'unknown'
}

/** GET – Öffentlich: Genehmigte Shop-Bewertungen (Kunden + Google) */
export async function GET() {
  try {
    const supabase = await createServerSupabase()
    const { data, error } = await supabase
      .from('shop_reviews')
      .select('id, rating, comment, display_name, source, created_at')
      .eq('moderation_status', 'approved')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('shop-reviews GET:', error)
      return NextResponse.json([], { status: 200 })
    }

    return NextResponse.json(data ?? [])
  } catch {
    return NextResponse.json([], { status: 200 })
  }
}

/** POST – Kunden können eine allgemeine Shop-Bewertung abgeben. Spam-Schutz: Rate-Limit, Honeypot, reCAPTCHA. */
export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req)
    const rateKey = `shop-reviews:${ip}`
    const { allowed } = checkRateLimit(rateKey, 3, 900)
    if (!allowed) {
      return NextResponse.json(
        { error: 'Zu viele Bewertungen von deiner IP. Bitte in 15 Minuten erneut versuchen.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => ({}))
    if (body.website_url != null && String(body.website_url).trim() !== '') {
      return NextResponse.json({ ok: true })
    }

    if (isRecaptchaConfigured()) {
      const token = typeof body.captcha_token === 'string' ? body.captcha_token.trim() : ''
      const verify = await verifyRecaptcha(token)
      if (!verify.success) {
        return NextResponse.json(
          { error: verify.error || 'Bitte bestätige, dass du kein Roboter bist.' },
          { status: 400 }
        )
      }
    }

    const supabase = await createServerSupabase()
    const rating = Math.min(5, Math.max(1, Number(body.rating) || 5))
    const comment = typeof body.comment === 'string' ? body.comment.trim().slice(0, 2000) : ''
    const displayName = typeof body.display_name === 'string' ? body.display_name.trim().slice(0, 100) : ''

    if (!displayName) {
      return NextResponse.json({ error: 'Bitte gib einen Anzeigenamen ein.' }, { status: 400 })
    }

    const { error } = await supabase.from('shop_reviews').insert({
      rating,
      comment: comment || null,
      display_name: displayName,
      source: 'customer',
      moderation_status: 'pending',
    })

    if (error) {
      console.error('shop-reviews POST:', error)
      return NextResponse.json({ error: 'Speichern fehlgeschlagen.' }, { status: 400 })
    }

    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('shop-reviews POST:', e)
    return NextResponse.json({ error: 'Fehler' }, { status: 500 })
  }
}
